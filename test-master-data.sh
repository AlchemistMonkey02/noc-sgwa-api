#!/bin/bash

BASE_URL="http://localhost:5000/api/master-data"

echo "==========================================="
echo "Testing Master Data API"
echo "==========================================="

echo "1. Get All Application Types"
curl -s "$BASE_URL/application-types" | python -m json.tool

echo ""
echo "-------------------------------------------"
echo "2. Get Sub Types for Industry (AppTypeCode=2)"
curl -s "$BASE_URL/application-sub-types?appTypeCode=2" | python -m json.tool

echo ""
echo "-------------------------------------------"
echo "3. Get Project Categories for Industry SubType (e.g., Code 1 - Packaged Drinking Water)"
curl -s "$BASE_URL/project-categories?appSubTypeCode=1" | python -m json.tool
