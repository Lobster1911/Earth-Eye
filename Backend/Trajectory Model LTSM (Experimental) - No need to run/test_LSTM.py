import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import tensorflow as tf
from sklearn.metrics import mean_squared_error, mean_absolute_error

# Load the test data and answer key
jan_test = pd.read_csv('D:\\Trajectory model\\archive\\jan_test.csv')  # Replace with actual path
answer_key = pd.read_csv('D:\\Trajectory model\\archive\\answer_key.csv')  # Replace with actual path

# Define the columns for features and targets
test_features = ['x_sim', 'y_sim', 'z_sim', 'Vx_sim', 'Vy_sim', 'Vz_sim']
actual_columns = ['x', 'y', 'z', 'Vx', 'Vy', 'Vz']

# Load the trained model
model = tf.keras.models.load_model("D:\\Trajectory model\\satellite_trajectory_model.h5", custom_objects={'mse': tf.keras.losses.MeanSquaredError()})

# Scale the test data
scaler = MinMaxScaler()
jan_test_scaled = scaler.fit_transform(jan_test[test_features])

# Reshape the test data to fit the LSTM input format
sequence_length = 10  # Adjust according to your model
X_test = np.array([jan_test_scaled[i:i+sequence_length] for i in range(len(jan_test_scaled) - sequence_length)])

# Make predictions
y_pred_scaled = model.predict(X_test)

# Inverse transform to get actual values
y_pred = scaler.inverse_transform(y_pred_scaled)

# Align the predictions with the answer key (since the test set was sliced into sequences, align properly)
y_actual = answer_key[actual_columns][sequence_length:].values  # Aligning with predictions

# Calculate and print error metrics
mse = mean_squared_error(y_actual, y_pred)
mae = mean_absolute_error(y_actual, y_pred)

def mean_absolute_percentage_error(y_true, y_pred):
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    return np.mean(np.abs((y_true - y_pred) / y_true)) * 100

# Calculate MAPE
mape = mean_absolute_percentage_error(y_actual, y_pred)

print(f"Mean Squared Error: {mse}")
print(f"Mean Absolute Error: {mae}")
print(f"Mean Absolute Percentage Error (MAPE): {mape}%")

# Optionally, compare a few predictions with the actual values
for i in range(5):  # Display first 5 comparisons for example
    print(f"Predicted: {y_pred[i]}, Actual: {y_actual[i]}")
