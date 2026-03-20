const MAP = {
  CREATED:          'badge-gray',
  PICKED_UP:        'badge-blue',
  IN_TRANSIT:       'badge-yellow',
  OUT_FOR_DELIVERY: 'badge-purple',
  DELIVERED:        'badge-green',
  FAILED_DELIVERY:  'badge-red',
  RETURNED:         'badge-orange',
  CANCELLED:        'badge-red',
}

const LABEL = {
  CREATED:          'Created',
  PICKED_UP:        'Picked Up',
  IN_TRANSIT:       'In Transit',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED:        'Delivered',
  FAILED_DELIVERY:  'Failed Delivery',
  RETURNED:         'Returned',
  CANCELLED:        'Cancelled',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`badge ${MAP[status] || 'badge-gray'}`}>
      {LABEL[status] || status}
    </span>
  )
}
