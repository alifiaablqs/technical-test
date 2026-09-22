const BASE_URL = '/api/orders'

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`
    const error = new Error(errorMsg)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export async function fetchOrders(params = {}) {
  const query = new URLSearchParams()
  if (params.technician_id) query.append('technician_id', params.technician_id)
  if (params.client_id) query.append('client_id', params.client_id)
  const queryString = query.toString() ? `?${query.toString()}` : ''

  const response = await fetch(`${BASE_URL}${queryString}`)
  return handleResponse(response)
}

export async function fetchOrderDetail(id, params = {}) {
  const query = new URLSearchParams()
  if (params.technician_id) query.append('technician_id', params.technician_id)
  if (params.client_id) query.append('client_id', params.client_id)
  const queryString = query.toString() ? `?${query.toString()}` : ''

  const response = await fetch(`${BASE_URL}/${id}${queryString}`)
  return handleResponse(response)
}

export async function createOrder(payload) {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  return handleResponse(response)
}

export async function updateOrderStatus(id, status) {
  const response = await fetch(`${BASE_URL}/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  })
  return handleResponse(response)
}

export async function cancelOrder(id) {
  const response = await fetch(`${BASE_URL}/${id}/cancel`, {
    method: 'POST',
  })
  return handleResponse(response)
}

export async function fetchTechnicians() {
  const response = await fetch('/api/users/technicians')
  return handleResponse(response)
}

export async function assignTechnician(id, technicianId) {
  const response = await fetch(`${BASE_URL}/${id}/assign`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ technician_id: Number(technicianId) }),
  })
  return handleResponse(response)
}
