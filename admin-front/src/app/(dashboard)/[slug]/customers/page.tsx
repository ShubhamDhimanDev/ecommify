"use client";

import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { ApiError, customerApi } from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { Table, TableHead, Th, TableBody, Tr, Td, TableEmpty } from "@/components/ui/Table";
import { formatDate } from "@/lib/utils";

type CustomerRow = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
};

export default function CustomersPage() {
  const { activeStore, isLoading: storeLoading } = useStore();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    notes: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const loadCustomers = useCallback(async (q?: string) => {
    if (!activeStore?.slug) return;
    setLoading(true);
    setError("");
    try {
      const res = await customerApi.list(activeStore.slug, q);
      setCustomers(res.data);
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e.message ?? "Failed to load customers.");
    } finally {
      setLoading(false);
    }
  }, [activeStore]);

  useEffect(() => {
    if (!activeStore?.slug) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCustomers();
  }, [activeStore?.slug, loadCustomers]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ first_name: "", last_name: "", email: "", phone: "", notes: "", password: "" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore?.slug) return;

    setSubmitting(true);
    setError("");
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name || null,
        email: form.email || null,
        phone: form.phone || null,
        notes: form.notes || null,
        password: form.password || null,
      };

      if (editingId) {
        await customerApi.update(activeStore.slug, editingId, payload);
      } else {
        await customerApi.create(activeStore.slug, payload);
      }

      resetForm();
      await loadCustomers(search || undefined);
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e.message ?? "Failed to save customer.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (customer: CustomerRow) => {
    setEditingId(customer.id);
    setForm({
      first_name: customer.first_name,
      last_name: customer.last_name ?? "",
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      notes: customer.notes ?? "",
      password: "",
    });
  };

  const remove = async (id: string) => {
    if (!activeStore?.slug) return;
    setError("");
    try {
      await customerApi.remove(activeStore.slug, id);
      await loadCustomers(search || undefined);
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e.message ?? "Failed to delete customer.");
    }
  };

  if (storeLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (!activeStore) {
    return <Alert variant="warning">Select a store to manage customers.</Alert>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Customers</h2>
        <p className="mt-1 text-sm text-zinc-500">Manage customers for {activeStore.name}.</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit customer" : "Create customer"}</CardTitle>
        </CardHeader>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
          <Input label="First name" value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} required />
          <Input label="Last name" value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          <Input label="Password" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} hint={editingId ? "Leave empty to keep current password." : "Optional for admin-created customer."} />
          <Input label="Notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          <div className="md:col-span-3 flex items-center gap-2">
            <Button type="submit" loading={submitting}>{editingId ? "Update" : "Create"}</Button>
            {editingId && <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>}
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer list</CardTitle>
          <div className="w-72">
            <Input
              placeholder="Search customers"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void loadCustomers(search || undefined);
                }
              }}
            />
          </div>
        </CardHeader>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <Table>
            <TableHead>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Created</Th>
              <Th className="text-right">Actions</Th>
            </TableHead>
            <TableBody>
              {customers.length === 0 ? (
                <TableEmpty message="No customers found." />
              ) : (
                customers.map((customer) => (
                  <Tr key={customer.id}>
                    <Td>{customer.first_name} {customer.last_name ?? ""}</Td>
                    <Td>{customer.email ?? "-"}</Td>
                    <Td>{customer.phone ?? "-"}</Td>
                    <Td>{formatDate(customer.created_at)}</Td>
                    <Td className="text-right">
                      <div className="inline-flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => startEdit(customer)}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => remove(customer.id)}>Delete</Button>
                      </div>
                    </Td>
                  </Tr>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
