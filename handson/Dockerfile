FROM python:3.9

WORKDIR /app
ADD requirements.txt /app/requirements.txt
RUN pip install -r requirements.txt

ADD . /app

EXPOSE 5000
CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]
