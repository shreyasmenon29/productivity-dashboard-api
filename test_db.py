from db import engine

def test_connection():
    with engine.connect() as conn:
        print("✅ Connected to PostgreSQL successfully!")

if __name__ == "__main__":
    test_connection()
