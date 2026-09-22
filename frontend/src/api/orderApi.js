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

export async function fetchOrders() {
  const response = await fetch(BASE_URL)
  return handleResponse(response)
}

export async function fetchOrderDetail(id) {
  const response = await fetch(`${BASE_URL}/${id}`)
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
