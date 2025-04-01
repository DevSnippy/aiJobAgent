import os
import json
import re
import shutil
import time
from datetime import datetime
from urllib.parse import urlparse
import PyPDF2
from io import BytesIO
from fastapi.middleware.cors import CORSMiddleware
import fitz  # PyMuPDF
from bs4 import BeautifulSoup
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

# Import Selenium components
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

# Import OpenAI – make sure to install openai library.
from openai import OpenAI

# ============ CONFIG ============
USER_INFO_PATH = "userInfo.json"
RESUMES_FOLDER = "resumes"  # Folder for storing user resumes
SETTINGS_PATH = "settings.json"
COVER_LETTERS_FOLDER = "cover_letters"

# Global state
last_analyzed_job_data = {
    "job_text": None,
    "company_text": None,
    "job_url": None
}
last_cover_letter_file = None

# Function to load settings
def load_settings():
    if os.path.exists(SETTINGS_PATH):
        with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    else:
        return {"api_key": "your_default_api_key"}

# Function to save settings
def save_settings(settings):
    with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
        json.dump(settings, f, indent=2, ensure_ascii=False)

settings = load_settings()
client = OpenAI(api_key=settings.get("api_key", "your_default_api_key"))

# ============ UTILS ============

def fetch_html_with_selenium(url):
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                         "AppleWebKit/537.36 (KHTML, like Gecko) "
                         "Chrome/90.0.4430.93 Safari/537.36")
    try:
        driver = webdriver.Chrome(options=options)
    except Exception as e:
        return f"Error initializing Selenium WebDriver: {e}"

    try:
        driver.get(url)
        time.sleep(5)  # Allow JavaScript to render
        html_content = driver.page_source
    except Exception as e:
        html_content = f"Error fetching {url} with Selenium: {e}"
    finally:
        driver.quit()
    return html_content

def extract_text_from_html(html_content):
    if html_content.startswith("Error fetching") or "Error fetching" in html_content:
        return html_content
    soup = BeautifulSoup(html_content, 'html.parser')
    for script in soup(["script", "style"]):
        script.decompose()
    return soup.get_text(separator=' ', strip=True)

def get_base_url(url):
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"

def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def extract_position_title(text):
    patterns = [
        r"(?i)Job Title[:\s]+(.+)",
        r"(?i)Position[:\s]+(.+)",
        r"(?i)We're hiring a[n]?\s+(.+?)\.",
        r"(?i)We are looking for a[n]?\s+(.+?)\.",
        r"(?i)Join our team as a[n]?\s+(.+?)\."
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            title = match.group(1).strip()
            return title.split(".")[0].strip()
    return "Job Application"

def generate_user_info(resume_text):
    prompt = f"""
    You're an AI that extracts structured user data from resumes.
    Parse the resume text below and return JSON using this schema:
    {{
      "first_name": "...",
      "middle_name": "...",
      "last_name": "...",
      "phone": "...",
      "email": "...",
      "country": "...",
      "city": "...",
      "address": "...",
      "zip_code": "...",
      "linkedin": "...",
      "personal_site": "...",
      "github": "...",
      "skills": ["...", "..."],
      "languages": ["...", "..."],
      "years_of_experience": "...",
      "summary": "...",
      "personal_note": "..."
    }}

    Instructions:
    - Fill in as many fields as possible from the resume text.
    - "skills" should include technical and professional skills, including programming languages like Python, Java, etc.
    - "languages" should include only spoken (natural) languages, such as English, Hebrew, Spanish, etc.
    - Do not confuse programming languages with spoken languages.
    - If spoken languages are not mentioned explicitly, infer the language from the resume's writing (e.g., if the resume is in English, assume "English" is a spoken language).
    - Use empty strings ("") or null for missing or unknown fields.
    - Do not add fields that are not part of the schema.


Resume Text:
{resume_text}
"""
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"Error during resume parsing: {e}")
        return None

def analyze_job(job_url: str):
    global last_analyzed_job_data

    if not os.path.exists(USER_INFO_PATH):
        return "❌ userInfo.json not found. Please upload a resume first."

    with open(USER_INFO_PATH, "r", encoding="utf-8") as f:
        user_info = json.load(f)

    job_html = fetch_html_with_selenium(job_url)
    if "Error fetching" in job_html:
        last_analyzed_job_data = {"job_text": None, "company_text": None, "job_url": None}
        return f"❌ Could not fetch the content for {job_url}\n{job_html}"

    job_text = extract_text_from_html(job_html)
    base_url = get_base_url(job_url)
    about_html = fetch_html_with_selenium(f"{base_url}/about")
    about_text = extract_text_from_html(about_html) if "Error fetching" not in about_html else "Could not retrieve company about page (Selenium error)."

    last_analyzed_job_data = {
        "job_text": job_text,
        "company_text": about_text,
        "job_url": job_url
    }

    prompt = f"""
You're a job assistant AI.
Please analyze the following information and provide detailed, structured advice.
Wrap your answer for each question in its own custom HTML tag as follows:
- For question 1, use <JobDescription> ... </JobDescription>
- For question 2, use <FitPercentile> ... </FitPercentile>
- For question 3, use <MatchingSkills> ... </MatchingSkills>
- For question 4, use <MissingSkills> ... </MissingSkills>
- For question 5, use <InterviewTips> ... </InterviewTips>
- For question 6, use <ImprovementAdvice> ... </ImprovementAdvice>
- For question 7, use <EssentialKnowledge> ... </EssentialKnowledge>
- For question 8, use <JobRequirements> ... </JobRequirements>

--- JOB POSTING TEXT ---
{job_text}

--- ABOUT COMPANY TEXT ---
{about_text}

--- USER RESUME DATA ---
{json.dumps(user_info, indent=2)}

Based on the above:
1. What is this job about?
2. If you have to put a percentile of how much I fit this job, what would it be and why? Explain.
3. What are the skills in my resume that fit this job?
4. What skills are mentioned in the job posting that are missing from my resume?
5. What should I talk about in an interview to make a good impression?
6. What should I study or improve to better fit this role?
7. What do I need to know?
8. What are the job requirements?

Be detailed, helpful, and structured. Clearly highlight any skill gaps.
"""

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error from OpenAI: {e}"



def write_cover_letter_and_save_pdf():
    global last_cover_letter_file

    if not os.path.exists(USER_INFO_PATH):
        return "❌ userInfo.json not found. Please upload a resume first."

    if not last_analyzed_job_data.get("job_text"):
        return "❌ No job has been analyzed yet. Please analyze a job first."

    with open(USER_INFO_PATH, "r", encoding="utf-8") as f:
        user_info = json.load(f)

    company_domain = urlparse(last_analyzed_job_data["job_url"]).netloc.split(".")[0].capitalize()
    company_name = company_domain if company_domain else "Company"
    position = extract_position_title(last_analyzed_job_data["job_text"])
    today_date = datetime.now().strftime("%B %d, %Y")

    prompt = f"""
You are an AI that writes professional cover letters for job applications.

Write a polished, natural-sounding cover letter with this format:
- A date line (e.g., "{today_date}")
- If recipient name and title are unknown, skip them.
- Include company name if known.
- Do not use placeholder text like [Recipient Name] or [Company Name].
- Make sure the letter flows smoothly without gaps.

Also return a line at the top with this format:
COVER LETTER FILE NAME: <Company>, <Position>

--- USER INFO ---
{json.dumps(user_info, indent=2)}

--- JOB POSTING TEXT ---
{last_analyzed_job_data["job_text"]}

--- COMPANY INFO ---
{last_analyzed_job_data["company_text"]}

Write the letter in a warm, confident tone. Start with a greeting and introduction, follow with two detailed paragraphs highlighting relevant experience and skills, and close with enthusiasm and gratitude. Sign off with the user’s full name.
"""
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )
        letter_text = response.choices[0].message.content

        os.makedirs(COVER_LETTERS_FOLDER, exist_ok=True)
        match = re.search(r"COVER LETTER FILE NAME: (.+), (.+)", letter_text)
        if match:
            company = match.group(1).strip()
            position = match.group(2).strip()
            filename = f"{COVER_LETTERS_FOLDER}/{company}, {position} cover letter.pdf"
            letter_text = re.sub(r"COVER LETTER FILE NAME: .+, .+\n?", "", letter_text).strip()
        else:
            filename = f"{COVER_LETTERS_FOLDER}/Generated_Cover_Letter.pdf"

        doc = fitz.open()
        page = doc.new_page()
        text_rect = fitz.Rect(50, 50, 550, 800)
        page.insert_textbox(text_rect, letter_text, fontsize=11, fontname="helv")
        doc.save(filename)
        last_cover_letter_file = filename

        return f"✅ Cover letter saved as PDF: {filename}\n\n{letter_text}"
    except Exception as e:
        return f"Error from OpenAI: {e}"

def upload_and_process_resume(file: UploadFile):
    try:
        # Read file content into a BytesIO object
        file_content = file.file.read()

        # Use PyPDF2 to extract text
        reader = PyPDF2.PdfReader(BytesIO(file_content))
        text = ""
        for page in reader.pages:
            text += page.extract_text()

        # Generate structured user info from the resume text using OpenAI
        user_info = generate_user_info(text)
        if user_info is None:
            return "❌ Failed to generate user information from the resume."

        # Update the userInfo.json file with the generated user info
        with open(USER_INFO_PATH, "w", encoding="utf-8") as f:
            json.dump(user_info, f, indent=2, ensure_ascii=False)

        return f"Resume processed and user info updated. Extracted text length: {len(text)}"
    except Exception as e:
        print("Error during resume parsing:", e)
        raise e


# ============ API MODELS ============

class JobURL(BaseModel):
    job_url: str

class ProfileUpdate(BaseModel):
    first_name: str = None
    middle_name: str = None
    last_name: str = None
    phone: str = None
    email: str = None
    country: str = None
    city: str = None
    address: str = None
    zip_code: str = None
    linkedin: str = None
    personal_site: str = None
    github: str = None
    skills: list = None
    languages: list = None
    years_of_experience: str = None
    summary: str = None
    personal_note: str = None

class SettingsUpdate(BaseModel):
    api_key: str

class APIKeyPayload(BaseModel):
    api_key: str

# ============ FASTAPI APP ============

app = FastAPI(title="AI Job Analyzer API")

# Enable CORS to allow all origins

origins = [ "null","http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Use explicit origins
    allow_credentials=True,  # Allow credentials if needed
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/analyze-job")
def api_analyze_job(job: JobURL):
    analysis = analyze_job(job.job_url)
    return {"analysis": analysis}

@app.post("/api/generate-cover-letter")
def api_generate_cover_letter():
    result = write_cover_letter_and_save_pdf()
    return {"result": result}


@app.get("/api/download-cover-letter")
def api_download_cover_letter():
    if last_cover_letter_file and os.path.exists(last_cover_letter_file):
        return FileResponse(last_cover_letter_file, media_type="application/pdf", filename=last_cover_letter_file.split("/")[-1])
    else:
        raise HTTPException(status_code=404, detail="Cover letter PDF not found. Please generate a cover letter first.")

@app.post("/api/upload-resume")
def api_upload_resume(file: UploadFile = File(...)):
    message = upload_and_process_resume(file)
    return {"message": message}

@app.get("/api/user-profile")
def api_get_user_profile():
    if not os.path.exists(USER_INFO_PATH):
        raise HTTPException(status_code=404, detail="User profile not found. Please upload a resume first.")
    with open(USER_INFO_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data

@app.post("/api/user-profile")
def api_update_user_profile(profile: ProfileUpdate):
    data = {}
    if os.path.exists(USER_INFO_PATH):
        with open(USER_INFO_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

    update_data = profile.dict(exclude_unset=True)
    print("Received update_data:", update_data)  # Debug print

    data.update(update_data)

    with open(USER_INFO_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    return {"message": "User profile updated successfully.", "updated_data": data}


@app.get("/api/settings")
def api_get_settings():
    return settings

@app.post("/api/settings")
def api_update_settings(new_settings: SettingsUpdate):
    settings["api_key"] = new_settings.api_key
    save_settings(settings)
    global client
    client = OpenAI(api_key=new_settings.api_key)
    return {"message": "Settings updated successfully."}

@app.get("/api/check-api-key")
def api_check_api_key():
    configured = bool(settings.get("api_key") and settings.get("api_key") != "your_default_api_key")
    return {"api_key_configured": configured}

@app.post("/api/verify-api-key")
def api_verify_api_key(payload: APIKeyPayload):
    try:
        test_client = OpenAI(api_key=payload.api_key)
        response = test_client.Model.list()  # Adjust as necessary for your version.
        valid = True if response else False
    except Exception as e:
        valid = False
    return {"valid": valid}

# ============ MAIN ============
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
