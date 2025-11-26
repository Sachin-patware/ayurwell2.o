from pymongo import MongoClient

def drop_db():
    client = MongoClient('mongodb://localhost:27017/')
    print("Dropping database 'ayurwell'...")
    client.drop_database('ayurwell')
    print("Database dropped.")

if __name__ == '__main__':
    drop_db()
