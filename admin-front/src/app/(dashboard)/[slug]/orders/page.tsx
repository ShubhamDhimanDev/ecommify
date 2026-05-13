"use client";

import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { ApiError, orderApi } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { Table, TableHead, Th, TableBody, Tr, Td, TableEmpty } from "@/components/ui/Table";
import { formatDate } from "@/lib/utils";

type OrderRow = {
  id: string;
  customer_id: string | null;
  status: string;
  currency: string;
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  created_at: string;
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "paid", label: "Paid" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function OrdersPage() {
  const { activeStore, isLoading: storeLoading } = useStore();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    order: OrderRow;
    items: Array<{ id: string; product_name: string; product_sku: string | null; quantity: number; unit_price: string; line_total: string; }>;
    events: Array<{ id: string; from_status: string | null; to_status: string; note: string | null; created_at: string; }>;
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const loadOrders = useCallback(async (status?: string) => {
    if (!activeStore?.slug) return;
    setLoading(true);
    setError("");
    try {
      const res = await orderApi.list(activeStore.slug, status ? { status } : undefined);
      setOrders(res.data);
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e.message ?? "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [activeStore]);

  useEffect(() => {
    if (!activeStore?.slug) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOrders(statusFilter || undefined);
  }, [activeStore?.slug, loadOrders, statusFilter]);

  const openDetail = async (orderId: string) => {
    if (!activeStore?.slug) return;
    setSelectedOrderId(orderId);
    setDetailLoading(true);
    setError("");
    try {
      const res = await orderApi.detail(activeStore.slug, orderId);
      setDetail({ order: res.order, items: res.items, events: res.events });
      setStatusUpdate(res.order.status);
      setStatusNote("");
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e.message ?? "Failed to load order details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async () => {
    if (!activeStore?.slug || !selectedOrderId || !statusUpdate) return;
    setUpdating(true);
    setError("");
    try {
      await orderApi.updateStatus(activeStore.slug, selectedOrderId, {
        status: statusUpdate,
        note: statusNote || undefined,
      });

      await Promise.all([
        loadOrders(statusFilter || undefined),
        openDetail(selectedOrderId),
      ]);
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e.message ?? "Failed to update order status.");
    } finally {
      setUpdating(false);
    }
  };

  if (storeLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (!activeStore) {
    return <Alert variant="warning">Select a store to manage orders.</Alert>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Orders</h2>
        <p className="mt-1 text-sm text-zinc-500">Manage orders for {activeStore.name}.</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle>Order list</CardTitle>
          <div className="w-72">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={STATUS_OPTIONS}
            />
          </div>
        </CardHeader>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <Table>
            <TableHead>
              <Th>Order</Th>
              <Th>Status</Th>
              <Th>Total</Th>
              <Th>Created</Th>
              <Th className="text-right">Actions</Th>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableEmpty message="No orders found." />
              ) : (
                orders.map((order) => (
                  <Tr key={order.id}>
                    <Td>#{order.id.slice(0, 8)}</Td>
                    <Td className="capitalize">{order.status}</Td>
                    <Td>{order.currency} {Number(order.total_amount).toFixed(2)}</Td>
                    <Td>{formatDate(order.created_at)}</Td>
                    <Td className="text-right">
                      <Button size="sm" variant="secondary" onClick={() => openDetail(order.id)}>
                        View
                      </Button>
                    </Td>
                  </Tr>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {selectedOrderId && (
        <Card>
          <CardHeader>
            <CardTitle>Order details</CardTitle>
            <Button size="sm" variant="secondary" onClick={() => { setSelectedOrderId(null); setDetail(null); }}>
              Close
            </Button>
          </CardHeader>

          {detailLoading || !detail ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <InfoTile label="Status" value={detail.order.status} />
                <InfoTile label="Subtotal" value={`${detail.order.currency} ${Number(detail.order.subtotal).toFixed(2)}`} />
                <InfoTile label="Tax" value={`${detail.order.currency} ${Number(detail.order.tax_amount).toFixed(2)}`} />
                <InfoTile label="Total" value={`${detail.order.currency} ${Number(detail.order.total_amount).toFixed(2)}`} />
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-zinc-900">Items</h3>
                <Table>
                  <TableHead>
                    <Th>Product</Th>
                    <Th>Qty</Th>
                    <Th>Unit</Th>
                    <Th>Total</Th>
                  </TableHead>
                  <TableBody>
                    {detail.items.map((item) => (
                      <Tr key={item.id}>
                        <Td>{item.product_name}</Td>
                        <Td>{item.quantity}</Td>
                        <Td>{Number(item.unit_price).toFixed(2)}</Td>
                        <Td>{Number(item.line_total).toFixed(2)}</Td>
                      </Tr>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-zinc-900">Update status</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  <Select value={statusUpdate} onChange={(e) => setStatusUpdate(e.target.value)} options={STATUS_OPTIONS.slice(1)} />
                  <Input placeholder="Optional note" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} />
                  <Button loading={updating} onClick={updateStatus}>Apply</Button>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-zinc-900">Status timeline</h3>
                <Table>
                  <TableHead>
                    <Th>From</Th>
                    <Th>To</Th>
                    <Th>Note</Th>
                    <Th>At</Th>
                  </TableHead>
                  <TableBody>
                    {detail.events.length === 0 ? (
                      <TableEmpty message="No events yet." />
                    ) : (
                      detail.events.map((event) => (
                        <Tr key={event.id}>
                          <Td>{event.from_status ?? "-"}</Td>
                          <Td>{event.to_status}</Td>
                          <Td>{event.note ?? "-"}</Td>
                          <Td>{formatDate(event.created_at)}</Td>
                        </Tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-900">{value}</p>
    </div>
  );
}
