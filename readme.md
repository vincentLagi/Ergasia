# ERGASIA

## About
ERGASIA is a decentralized platform connecting clients and freelancers, developed for Hackatan 11 by Codefeast. The platform enables clients to post and manage jobs, while freelancers can search and apply for jobs that match their skills.

## Features

### Client Features
- Post new jobs
- Job management
- Review work submissions
- Messaging system with freelancers
- Accept/reject submissions
- Payment using Ergasia token via icrc1 ledger
- AI agent for finding freelancer 


### Freelancer Features
- Apply for jobs
- Submit work
- Job search
- AI agent for making cover letter and profile

## Technology Stack
- **Backend**: Motoko (Internet Computer)
- **Frontend**: React (TypeScript)
- **AI Components**: 
  - Python DeepFace for face recognition
  - Fetch AI
- **Wallet Integration**: icrc1 ledger
- **Authentication**: Internet Identity

## Installation & Setup

### Prerequisites
- Node.js 
- DFX (Internet Computer SDK)
- Python 3.x
  
### Backend Setup
```bash
# Install DFX
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Start local replica
dfx start --clean or dfx start 

# Deploy canisters
dfx deploy
```

### Frontend Setup
```bash
# Install dependencies
npm install

# Start the development server
npm start
```

## Python Installation & Setup

### AI System Setup

#### **1. Create requirements.txt**
Create a file named `requirements.txt` with the following content:
```txt
absl-py==2.1.0
astunparse==1.6.3
Flask==3.1.0
flask-cors==5.0.1
scikit-learn==1.6.1
pandas==2.2.3
numpy==2.0.2
tensorflow==2.18.0
keras==3.8.0
joblib==1.4.2
requests==2.32.3
deepface==0.0.89
fastapi
uvicorn
tf_keras
python-multipart
uagents
uagents-core
scipy
```

#### **2. Set Up Virtual Environment**
```bash
# Create and activate virtual environment
python -m venv ai_venv
source ai_venv/bin/activate  # Linux/Mac
ai_venv\Scripts\activate     # Windows

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

#### **3. Run the Recommendation System**
```bash
# Change the directory to project_backend/AI
cd ./src/project_backend/AI

# Run the Python file
python main.py
```

### Face Recognition System Setup

#### **1. Install Dependencies from environment.yml**
#### Download environment.yml (if not already available)
- [environment.yml](https://github.com/memeett/icp/blob/master/environment.yml)

Ensure you have Conda installed, then run:
```bash

# Create a Conda environment from environment.yml
conda env create -f environment.yml -n fr_venv python=3.9.10

# Activate the environment
conda activate fr_venv

#### **2. Run the Face Recognition System**
# Change the directory to project_backend/face_recognition
cd ./../face_recognition/app

# Run the Python file
python main.py
```
