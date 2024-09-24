import OrderOptions from '@/components/dropdown-menus/order-options'
import Link from 'next/link'

import { OrderStatus } from '@/enums/order-status'
import { formatDate } from '@/utils/formatDate'
import { Order } from '@/types/order'

interface CardProps {
  order: Order
  orderNumber: number
}

export default function Card({ order, orderNumber }: CardProps) {
  return (
    <Link href={`/orders/${order.id}`}>
      <div className="border h-[300px] rounded-xl flex flex-col border-primary p-6 text-secondary">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="font-medium">Pedido {orderNumber}</h2>
          <OrderOptions order={order} variant="ghost" showViewItem />
        </div>

        {/* Body */}
        <div className="mt-5 flex-1">
          <span className="text-xs text-terciary">
            {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
          </span>
          <ul className="text-sm">
            {order.items.length > 3 ? (
              <>
                {order.items.slice(0, 3).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between"
                  >
                    <span>{item.name}</span>
                    <span>
                      {item.quantity} {item.unit}
                    </span>
                  </li>
                ))}
                <li>
                  <span>...</span>
                </li>
              </>
            ) : (
              order.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between">
                  <span>{item.name}</span>
                  <span>
                    {item.quantity} {item.unit.toLowerCase()}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Divider */}
        <div className="h-px bg-border my-6" />

        {/* Footer */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-xs text-terciary">Status</span>
            {order.status === OrderStatus.PAID ? (
              <span className="text-sm font-medium text-status-paid">Pago</span>
            ) : (
              <span className="text-sm font-medium text-status-pending-alternative">
                Pendente
              </span>
            )}
            <span className="text-sm"></span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-terciary">Criado em</span>
            <span className="text-sm">{formatDate(order.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
