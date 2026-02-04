# Helper scripts

- postgres_setup
    - postgres_setup, to be run inside helpers folder
        - Setup postgres instance
    - postgres_test_connection, to be run inside helpers folder 
        - Test connection with postgres instance
    - postgres_remove, to be run inside helpers folder
        - Remove postgres

- database_setup
    - setup.py, initializes owners, accounts and category with values of setup.json

- generate_flask_secret_key 
    - Generates value for .env SECRET_KEY variable