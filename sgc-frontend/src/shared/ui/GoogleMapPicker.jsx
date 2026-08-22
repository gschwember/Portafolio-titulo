import { useEffect, useMemo, useRef } from 'react'

const DEFAULT_CENTER = { lat: -33.4489, lng: -70.6693 } // Santiago de Chile

const loadGoogleMapsScript = (apiKey) => {
  if (!apiKey) {
    return Promise.reject(new Error('Falta API key de Google Maps'))
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps)
  }

  if (window.__sgcGoogleMapsPromise) {
    return window.__sgcGoogleMapsPromise
  }

  window.__sgcGoogleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => resolve(window.google.maps)
    script.onerror = () => reject(new Error('No se pudo cargar Google Maps'))
    document.head.appendChild(script)
  })

  return window.__sgcGoogleMapsPromise
}

const toNumberOrNull = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const GoogleMapPicker = ({
  apiKey,
  latitude,
  longitude,
  addressQuery = '',
  onLocationChange,
  readOnly = false,
  heightClassName = 'h-72',
}) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const geocoderRef = useRef(null)

  const center = useMemo(() => {
    const lat = toNumberOrNull(latitude)
    const lng = toNumberOrNull(longitude)
    if (lat === null || lng === null) {
      return DEFAULT_CENTER
    }
    return { lat, lng }
  }, [latitude, longitude])

  useEffect(() => {
    let cancelled = false

    const initMap = async () => {
      if (!mapRef.current || !apiKey) {
        return
      }

      try {
        await loadGoogleMapsScript(apiKey)
        if (cancelled || !mapRef.current) {
          return
        }

        const map = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: center === DEFAULT_CENTER ? 11 : 16,
          disableDefaultUI: false,
          streetViewControl: false,
          mapTypeControl: false,
        })

        const marker = new window.google.maps.Marker({
          position: center,
          map,
          draggable: !readOnly,
        })

        geocoderRef.current = new window.google.maps.Geocoder()
        mapInstanceRef.current = map
        markerRef.current = marker

        if (!readOnly) {
          map.addListener('click', (event) => {
            const lat = Number(event.latLng.lat().toFixed(7))
            const lng = Number(event.latLng.lng().toFixed(7))
            marker.setPosition({ lat, lng })
            onLocationChange?.({ lat, lng })
          })

          marker.addListener('dragend', (event) => {
            const lat = Number(event.latLng.lat().toFixed(7))
            const lng = Number(event.latLng.lng().toFixed(7))
            onLocationChange?.({ lat, lng })
          })
        }
      } catch {
        // El fallback se maneja por render sin API key.
      }
    }

    initMap()
    return () => {
      cancelled = true
    }
  }, [apiKey, center, onLocationChange, readOnly])

  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) {
      return
    }
    markerRef.current.setPosition(center)
    mapInstanceRef.current.panTo(center)
  }, [center])

  const geocodeAddress = () => {
    if (!addressQuery || !geocoderRef.current || !mapInstanceRef.current || !markerRef.current || readOnly) {
      return
    }

    geocoderRef.current.geocode({ address: addressQuery }, (results, status) => {
      if (status !== 'OK' || !results?.[0]?.geometry?.location) {
        return
      }

      const location = results[0].geometry.location
      const lat = Number(location.lat().toFixed(7))
      const lng = Number(location.lng().toFixed(7))
      const next = { lat, lng }
      markerRef.current.setPosition(next)
      mapInstanceRef.current.setCenter(next)
      mapInstanceRef.current.setZoom(16)
      onLocationChange?.(next)
    })
  }

  if (!apiKey) {
    const query = encodeURIComponent(addressQuery || `${center.lat},${center.lng}`)
    const src = `https://www.google.com/maps?q=${query}&output=embed`
    return (
      <div className="space-y-2">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Configura <code>VITE_GOOGLE_MAPS_API_KEY</code> para habilitar marcador interactivo.
        </div>
        <iframe title="Mapa condominio" src={src} className={`w-full rounded-lg border border-stone-300 ${heightClassName}`} loading="lazy" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {!readOnly && (
        <button
          type="button"
          onClick={geocodeAddress}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100"
        >
          Buscar direccion en mapa
        </button>
      )}
      <div ref={mapRef} className={`w-full rounded-lg border border-stone-300 ${heightClassName}`} />
    </div>
  )
}

export default GoogleMapPicker
