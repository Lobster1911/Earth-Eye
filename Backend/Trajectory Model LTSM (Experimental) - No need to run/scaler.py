import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import joblib

# Load the training data
training_data_path = "D:\\Trajectory model\\archive\\jan_train.csv"
df_train = pd.read_csv(training_data_path)

# Assuming the relevant features are 'x', 'y', 'z', 'Vx', 'Vy', 'Vz'
features = ['x', 'y', 'z', 'Vx', 'Vy', 'Vz']
X_train = df_train[features]

# Fit the MinMaxScaler on the training data
scaler = MinMaxScaler()
scaler.fit(X_train)

# Save the fitted scaler
scaler_path = "D:\\Trajectory model\\scaler.pkl"
joblib.dump(scaler, scaler_path)
print(f"Scaler saved to {scaler_path}")
