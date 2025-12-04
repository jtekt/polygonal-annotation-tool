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
| VUE_APP_LABELS | Comma‑separated list of predefined labels |
| VUE_APP_DEFAULT_LABEL | Default label selected when creating a new annotation |
| VUE_APP_ANNOTATION_FIELD | Name of the field where annotations are stored |
| VUE_APP_CATEGORIZER | Field used to categorize or group annotations |
| VUE_APP_DISPLAYED_FIELDS | Comma‑separated list of fields to display in the UI |
| VUE_APP_ENABLE_BRUSH | Enables the brush tool (true/false) |
| VUE_APP_ENABLE_POLYLINE | Enables the polyline drawing tool (true/false) |
| VUE_APP_HELPER_RECTANGLE | Four comma‑separated coordinates defining a helper rectangle (x1,y1,x2,y2) |

### Authentication (Standard)
| Variable | Description |
| --- | --- |
| VUE_APP_AUTHENTICATION_API_URL | Base API URL for standard authentication |
| VUE_APP_IDENTIFICATION_URL | URL to retrieve user information |
| VUE_APP_LOGIN_URL | Direct login endpoint |
| VUE_APP_LOGIN_HINT | Preset login hint used to pre‑fill login forms |
| VUE_APP_HOMEPAGE_URL | URL to redirect users after authentication |

### Authentication (OIDC)
| Variable | Description |
| --- | --- |
| VUE_APP_OIDC_AUTHORITY | OIDC authority (issuer) URL |
| VUE_APP_OIDC_CLIENT_ID | Client ID used for OIDC authentication |
| VUE_APP_OIDC_AUDIENCE | Audience identifier for OIDC tokens |

## Container images

Container images are available on the [AWS ECR Public Gallery](https://gallery.ecr.aws/u6l4m3e5/polygonal-annotation-tool)