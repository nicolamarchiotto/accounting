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
- 06/06/25
    - Better UI for EntryDialog
    - Import entries functionality
    - Maybe move accounts balance at on header of accounts container as an additional features
    - Unify Entries and Statistics card so that it is clear that statistics refere to current date selected on entries
        - Keep separation of entry list and statistics, where graphs will be shown   
    - Scollable entries container with max enties/page, define better container for single entries  
- working on import scripts
    - errors on add entries, improve error prompting for logging and to easily recognize error 
