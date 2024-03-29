# Polygonal annotation tool

This is an anotation tool for imaga datsets intended to be used in AI applications. 
It allows the highlight of an image area via the drawing of polygons, directly in the web browser.

<p align="center">
  <img src="./docs/annotation_tool_polygon.gif">
</p>

## Environment variables
| Variable | Description |
| --- | --- | 
| VUE_APP_STORAGE_SERVICE_API_URL | The URL of the storage service |
| VUE_APP_LOGIN_URL | Login URL of the authentication service |
| VUE_APP_IDENTIFICATION_URL | URL for the user identification |
| VUE_APP_LABELS | Comma separated list of premade labels |

## Container images

Container images are available on the [AWS ECR Public Gallery](https://gallery.ecr.aws/u6l4m3e5/polygonal-annotation-tool)