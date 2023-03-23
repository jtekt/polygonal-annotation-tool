#!/bin/sh

ROOT_DIR=/app

# Replace env vars in files served by NGINX
echo "Replacing environment variables"
for file in $ROOT_DIR/js/*.js* $ROOT_DIR/index.html $ROOT_DIR/precache-manifest*.js;
do
  echo "Processing $file ...";

  sed -i 's|VUE_APP_STORAGE_SERVICE_API_URL_PLACEHOLDER|'${VUE_APP_STORAGE_SERVICE_API_URL}'|g' $file

  sed -i 's|VUE_APP_LABELS_PLACEHOLDER|'${VUE_APP_LABELS}'|g' $file
  sed -i 's|VUE_APP_ANNOTATION_FIELD_PLACEHOLDER|'${VUE_APP_ANNOTATION_FIELD}'|g' $file
  sed -i 's|VUE_APP_CATEGORIZER_PLACEHOLDER|'${VUE_APP_CATEGORIZER}'|g' $file
  sed -i 's|VUE_APP_HELPER_RECTANGLE_PLACEHOLDER|'${VUE_APP_HELPER_RECTANGLE}'|g' $file
  sed -i 's|VUE_APP_DISPLAYED_FIELDS_PLACEHOLDER|'${VUE_APP_DISPLAYED_FIELDS}'|g' $file


  sed -i 's|VUE_APP_AUTHENTICATION_API_URL_PLACEHOLDER|'${VUE_APP_AUTHENTICATION_API_URL}'|g' $file
  sed -i 's|VUE_APP_IDENTIFICATION_URL_PLACEHOLDER|'${VUE_APP_IDENTIFICATION_URL}'|g' $file
  sed -i 's|VUE_APP_LOGIN_URL_PLACEHOLDER|'${VUE_APP_LOGIN_URL}'|g' $file


done

echo "Starting Nginx"
nginx -g 'daemon off;'
