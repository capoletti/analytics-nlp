FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY load.py /app/load.py
COPY sql /app/sql
CMD ["python", "load.py"]
