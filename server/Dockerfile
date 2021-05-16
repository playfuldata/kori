# syntax=docker/dockerfile:1
FROM python:3.8-slim-buster

ENV PYTHONUNBUFFERED True

ENV APP_HOME /app
WORKDIR $APP_HOME

COPY . .
# COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt
RUN mkdir -p lang_models
ADD https://s3.amazonaws.com/dl4j-distribution/GoogleNews-vectors-negative300.bin.gz ./lang_models/
RUN python -m spacy download en_core_web_sm


CMD [ "python",  "server.py"]