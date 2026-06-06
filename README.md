# Accounting

Application for managing home finance and expenses 

# Setup

Ensure to valorize admin credentials using .env file

Use helpers/generate_flask_secret_key.py to generate .env SECRET_KEY

User helpers/postgres_* scripts to setup postgres instance

# Run application

start script does not work correctly


Backend: Activate python env and run app manuall

```
python app.py
```

Frontend:

npm run dev -- --host 0.0.0.0 --port 5173

# TODO

## Backend
- working on import scripts
    - errors on add entries, improve error prompting for logging and to easily recognize error 
