
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

# Cargar datos
data = pd.read_csv('productos.csv')

# Preprocesar datos
X = data.drop('categoria', axis=1)  # Ajusta según tu CSV
y = data['categoria']

# Dividir datos
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Entrenar modelo
model = RandomForestClassifier()
model.fit(X_train, y_train)

# Guardar modelo (opcional)
import joblib
joblib.dump(model, 'modelo_recomendaciones.pkl')
