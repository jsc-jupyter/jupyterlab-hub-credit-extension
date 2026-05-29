import os
import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado

class getAPIToken(APIHandler):
    @tornado.web.authenticated
    def get(self):
        token = os.environ.get("JUPYTERHUB_API_TOKEN", "")
        self.finish(json.dumps({
            "data": token
        }))


def setup_route_handlers(web_app):
    host_pattern = ".*$"
    base_url = web_app.settings["base_url"]

    get_api_token_pattern = url_path_join(base_url, "hub-credit-extension", "api-token")
    handlers = [(get_api_token_pattern, getAPIToken)]

    web_app.add_handlers(host_pattern, handlers)
