from textblob import TextBlob
import pandas as pd

# Cargar datos
data = pd.read_csv('reseñas.csv')

# Análisis de sentimientos
data['sentimiento'] = data['reseña'].apply(lambda x: TextBlob(x).sentiment.polarity)

# Guardar resultados
data.to_csv('reseñas_con_sentimientos.csv', index=False)
