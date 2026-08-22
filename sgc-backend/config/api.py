import json
from urllib.error import HTTPError, URLError
from urllib.request import urlopen

from django.http import JsonResponse


def healthcheck(_request):
    return JsonResponse({'status': 'ok', 'service': 'sgc-backend'})


def economic_indicators(_request):
    try:
        with urlopen("https://mindicador.cl/api", timeout=8) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
        return JsonResponse(
            {
                "uf": None,
                "utm": None,
                "source": "mindicador.cl",
                "error": "No fue posible consultar indicadores economicos.",
            },
            status=503,
        )

    uf = payload.get("uf", {})
    utm = payload.get("utm", {})
    return JsonResponse(
        {
            "uf": {
                "value": uf.get("valor"),
                "date": uf.get("fecha"),
            },
            "utm": {
                "value": utm.get("valor"),
                "date": utm.get("fecha"),
            },
            "source": "mindicador.cl",
        }
    )
