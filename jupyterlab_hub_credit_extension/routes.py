import json
import os

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado

class getAPIToken(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        token = os.environ.get('JUPYTERHUB_API_TOKEN', '')
        self.finish(json.dumps({
            "data": (
                token
            ),
        }))


def setup_route_handlers(web_app):
    host_pattern = ".*$"
    base_url = web_app.settings["base_url"]

    token_route_pattern = url_path_join(base_url, "jupyterlab-hub-credit-extension")
    handlers = [(token_route_pattern, getAPIToken)]

    web_app.add_handlers(host_pattern, handlers)
