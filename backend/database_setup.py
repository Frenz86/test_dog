import sqlite3
from sqlite3 import Error

def create_connection(db_file):
    """ create a database connection to the SQLite database
        specified by db_file
    :param db_file: database file
    :return: Connection object or None
    """
    conn = None
    try:
        conn = sqlite3.connect(db_file)
        return conn
    except Error as e:
        print(e)

    return conn

def create_table(conn, create_table_sql):
    """ create a table from the create_table_sql statement
    :param conn: Connection object
    :param create_table_sql: a CREATE TABLE statement
    :return:
    """
    try:
        c = conn.cursor()
        c.execute(create_table_sql)
    except Error as e:
        print(e)

def main():
    database = "backend/bookings.db"

    sql_create_users_table = """ CREATE TABLE IF NOT EXISTS users (
                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                    email TEXT UNIQUE NOT NULL,
                                    password_hash TEXT NOT NULL,
                                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                ); """

    sql_create_pets_table = """ CREATE TABLE IF NOT EXISTS pets (
                                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                                   user_id INTEGER NOT NULL,
                                   name TEXT NOT NULL,
                                   type TEXT,
                                   breed TEXT,
                                   size TEXT,
                                   weight TEXT,
                                   sex TEXT,
                                   age TEXT,
                                   additional_info TEXT,
                                   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                   FOREIGN KEY (user_id) REFERENCES users (id)
                               ); """

    sql_create_bookings_table = """ CREATE TABLE IF NOT EXISTS bookings (
                                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                                       user_id INTEGER NOT NULL,
                                       pet_id INTEGER NOT NULL,
                                       service_type TEXT NOT NULL,
                                       booking_date TEXT NOT NULL,
                                       booking_time TEXT NOT NULL,
                                       status TEXT DEFAULT 'confirmed',
                                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                       FOREIGN KEY (user_id) REFERENCES users (id),
                                       FOREIGN KEY (pet_id) REFERENCES pets (id)
                                   ); """

    # create a database connection
    conn = create_connection(database)

    # create tables
    if conn is not None:
        create_table(conn, sql_create_users_table)
        create_table(conn, sql_create_pets_table)
        create_table(conn, sql_create_bookings_table)
        conn.close()
    else:
        print("Error! cannot create the database connection.")

if __name__ == '__main__':
    main()
