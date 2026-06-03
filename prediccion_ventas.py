import pandas as pd
from fbprophet import Prophet

# Cargar datos
data = pd.read_csv('ventas.csv')

# Preprocesar datos
data['fecha'] = pd.to_datetime(data['fecha'])  # Asegúrate de que 'fecha' sea el nombre correcto de la columna
data = data.rename(columns={'fecha': 'ds', 'ventas': 'y'})  # Ajusta según tu CSV

# Crear y entrenar el modelo
model = Prophet()
model.fit(data)

# Hacer predicciones
future = model.make_future_dataframe(periods=30)  # Cambia el número de días según necesites
forecast = model.predict(future)

# Guardar resultados
forecast.to_csv('predicciones_ventas.csv', index=False)
