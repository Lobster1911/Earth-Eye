import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout

# Load the datasets
jan_train = pd.read_csv('D:\\Trajectory model\\archive\\jan_train.csv')
jan_test = pd.read_csv('D:\\Trajectory model\\archive\\jan_test.csv')
answer_key = pd.read_csv('D:\\Trajectory model\\archive\\answer_key.csv')

# Display the first few rows of each to understand the structure
print("Training Data:")
print(jan_train.head())
print("\nTest Data:")
print(jan_test.head())
print("\nAnswer Key:")
print(answer_key.head())

# Select the relevant columns
train_features = ['x', 'y', 'z', 'Vx', 'Vy', 'Vz']
train_targets = ['x_sim', 'y_sim', 'z_sim', 'Vx_sim', 'Vy_sim', 'Vz_sim']

# Normalize the data
scaler = MinMaxScaler()
train_scaled = scaler.fit_transform(jan_train[train_features + train_targets])

# Convert to DataFrame
train_scaled_df = pd.DataFrame(train_scaled, columns=train_features + train_targets)

# Create sequences for LSTM
def create_sequences(data, seq_length):
    xs, ys = [], []
    for i in range(len(data) - seq_length):
        x = data.iloc[i:i+seq_length][train_features].values
        y = data.iloc[i+seq_length][train_targets].values
        xs.append(x)
        ys.append(y)
    return np.array(xs), np.array(ys)

seq_length = 10  # Example sequence length
X_train, y_train = create_sequences(train_scaled_df, seq_length)

# Build the LSTM model
model = Sequential()

model.add(LSTM(64, input_shape=(X_train.shape[1], X_train.shape[2]), return_sequences=True))
model.add(Dropout(0.2))

model.add(LSTM(64, return_sequences=False))
model.add(Dropout(0.2))

model.add(Dense(32, activation='relu'))
model.add(Dense(6))  # Output layer for x_sim, y_sim, z_sim, Vx_sim, Vy_sim, Vz_sim

model.compile(optimizer='adam', loss='mse')

# Print the model summary
model.summary()

# Train the model
history = model.fit(X_train, y_train, epochs=50, batch_size=32, validation_split=0.2)

# Save the model
model.save("satellite_trajectory_model.h5")

# Preprocess the test data similarly
jan_test_scaled = scaler.transform(jan_test[train_features + train_targets])
jan_test_scaled_df = pd.DataFrame(jan_test_scaled, columns=train_features + train_targets)

X_test, y_test = create_sequences(jan_test_scaled_df, seq_length)

# Make predictions
y_pred = model.predict(X_test)

# Inverse transform the predictions
y_pred_inverse = scaler.inverse_transform(np.concatenate((y_pred, y_test[:, 6:]), axis=1))[:, :6]

# Compare predictions with actual values from answer_key
print("\nPredictions vs Actual:")
for i in range(5):  # Display first 5 comparisons
    print(f"True: {answer_key.iloc[i].values}, Predicted: {y_pred_inverse[i]}")

# Evaluate the model on the test data
test_loss = model.evaluate(X_test, y_test)
print(f"\nTest Loss: {test_loss}")
