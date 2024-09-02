import requests
import json
import configparser

# Load configuration
config = configparser.ConfigParser()
config.read("D:\\Satellite Tracking and Trajectory Prediction Web - Application\\Backend\\Proxy\\config.ini")

try:
    configUsr = config.get("configuration", "username")
    configPwd = config.get("configuration", "password")
except configparser.NoSectionError as e:
    raise Exception(f"Configuration section missing: {e}")
except configparser.NoOptionError as e:
    raise Exception(f"Configuration option missing: {e}")

siteCred = {'identity': configUsr, 'password': configPwd}

uriBase = "https://www.space-track.org"
requestLogin = "/ajaxauth/login"
requestCmdAction = "/basicspacedata/query"

def fetch_satellite_data():
    with requests.Session() as session:
        try:
            # Login to Space-Track
            resp = session.post(uriBase + requestLogin, data=siteCred)
            if resp.status_code != 200:
                raise Exception(f"Login failed with status code {resp.status_code}")

            # Fetch satellite names and IDs
            fetch_url = f"{uriBase}{requestCmdAction}/class/satcat/orderby/NORAD_CAT_ID asc/format/json"
            resp = session.get(fetch_url)
            if resp.status_code != 200:
                raise Exception(f"GET failed with status code {resp.status_code}")

            # Parse response
            data = resp.json()

            # Extract satellite names and IDs into a dictionary
            satellite_dict = {sat["OBJECT_NAME"]: sat["NORAD_CAT_ID"] for sat in data}

            # Save to a txt file
            with open("satellite_data.txt", "w") as file:
                for name, norad_id in satellite_dict.items():
                    file.write(f'"{name}": "{norad_id}",\n')

            print("Satellite data has been saved to satellite_data.txt")

        except Exception as e:
            print(f"Error fetching satellite data: {str(e)}")

if __name__ == "__main__":
    fetch_satellite_data()
