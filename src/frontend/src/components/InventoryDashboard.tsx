import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@/hooks/useActor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Edit2,
  Loader2,
  MessageCircle,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
// Local type definitions matching Motoko backend
interface Material {
  id: bigint;
  name: string;
  unit: string;
  lastUpdated: bigint;
  quantity: bigint;
}
interface Delivery {
  id: bigint;
  customerName: string;
  date: bigint;
  materialId: bigint;
  notes: string;
  quantity: bigint;
  price: bigint;
  materialName: string;
}
interface Payment {
  id: bigint;
  customerName: string;
  date: bigint;
  isPaid: boolean;
  amount: bigint;
}
interface MachineBooking {
  id: bigint;
  customerName: string;
  isCompleted: boolean;
  bookingDate: bigint;
  returnDate?: bigint;
  machineType: string;
}
interface InventoryActor {
  getAllMaterials(): Promise<Array<Material>>;
  addMaterial(m: Material): Promise<bigint>;
  updateMaterial(id: bigint, m: Material): Promise<void>;
  deleteMaterial(id: bigint): Promise<void>;
  getAllDeliveries(): Promise<Array<Delivery>>;
  addDelivery(d: Delivery): Promise<bigint>;
  updateDelivery(id: bigint, d: Delivery): Promise<void>;
  deleteDelivery(id: bigint): Promise<void>;
  getAllPayments(): Promise<Array<Payment>>;
  addPayment(p: Payment): Promise<bigint>;
  updatePayment(id: bigint, p: Payment): Promise<void>;
  deletePayment(id: bigint): Promise<void>;
  getAllMachineBookings(): Promise<Array<MachineBooking>>;
  addMachineBooking(b: MachineBooking): Promise<bigint>;
  updateMachineBooking(id: bigint, b: MachineBooking): Promise<void>;
  completeMachineBooking(id: bigint, returnDate: bigint): Promise<void>;
  isCallerAdmin(): Promise<boolean>;
}

function formatDate(ts: bigint) {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("hi-IN");
}

function nowNano() {
  return BigInt(Date.now()) * BigInt(1_000_000);
}

// ─── Materials Tab ────────────────────────────────────────────────────────────
function MaterialsTab() {
  const { actor } = useActor();
  const qc = useQueryClient();

  const { data: materials = [], isLoading: loadMat } = useQuery<Material[]>({
    queryKey: ["materials"],
    queryFn: () => (actor as unknown as InventoryActor).getAllMaterials(),
    enabled: !!actor,
  });

  const { data: deliveries = [], isLoading: loadDel } = useQuery<Delivery[]>({
    queryKey: ["deliveries"],
    queryFn: () => (actor as unknown as InventoryActor).getAllDeliveries(),
    enabled: !!actor,
  });

  const [addMatOpen, setAddMatOpen] = useState(false);
  const [editMat, setEditMat] = useState<Material | null>(null);
  const [matForm, setMatForm] = useState({ name: "", quantity: "", unit: "" });

  const [addDelOpen, setAddDelOpen] = useState(false);
  const [delForm, setDelForm] = useState({
    customerName: "",
    materialId: "",
    quantity: "",
    price: "",
    notes: "",
  });

  const addMat = useMutation({
    mutationFn: () =>
      (actor as unknown as InventoryActor).addMaterial({
        id: BigInt(0),
        name: matForm.name,
        quantity: BigInt(matForm.quantity || 0),
        unit: matForm.unit,
        lastUpdated: nowNano(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials"] });
      setAddMatOpen(false);
      setMatForm({ name: "", quantity: "", unit: "" });
      toast.success("सामग्री जोड़ी गई!");
    },
    onError: () => toast.error("Error adding material"),
  });

  const updateMat = useMutation({
    mutationFn: (m: Material) =>
      (actor as unknown as InventoryActor).updateMaterial(m.id, {
        ...m,
        name: matForm.name,
        quantity: BigInt(matForm.quantity || 0),
        unit: matForm.unit,
        lastUpdated: nowNano(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials"] });
      setEditMat(null);
      toast.success("अपडेट हो गया!");
    },
    onError: () => toast.error("Error updating"),
  });

  const deleteMat = useMutation({
    mutationFn: (id: bigint) =>
      (actor as unknown as InventoryActor).deleteMaterial(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials"] });
      toast.success("हटा दिया गया!");
    },
    onError: () => toast.error("Error deleting"),
  });

  const addDel = useMutation({
    mutationFn: () =>
      (actor as unknown as InventoryActor).addDelivery({
        id: BigInt(0),
        customerName: delForm.customerName,
        materialId: BigInt(delForm.materialId || 0),
        materialName:
          materials.find((m) => String(m.id) === delForm.materialId)?.name ||
          "",
        quantity: BigInt(delForm.quantity || 0),
        price: BigInt(delForm.price || 0),
        notes: delForm.notes,
        date: nowNano(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deliveries"] });
      setAddDelOpen(false);
      setDelForm({
        customerName: "",
        materialId: "",
        quantity: "",
        price: "",
        notes: "",
      });
      toast.success("डिलीवरी जोड़ी गई!");
    },
    onError: () => toast.error("Error adding delivery"),
  });

  const deleteDel = useMutation({
    mutationFn: (id: bigint) =>
      (actor as unknown as InventoryActor).deleteDelivery(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deliveries"] });
      toast.success("हटा दिया गया!");
    },
  });

  function openEditMat(m: Material) {
    setEditMat(m);
    setMatForm({ name: m.name, quantity: String(m.quantity), unit: m.unit });
  }

  return (
    <div className="space-y-6">
      {/* Materials List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold" style={{ color: "#ffcc00" }}>
            📦 सामग्री स्टॉक
          </h3>
          <Dialog open={addMatOpen} onOpenChange={setAddMatOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                style={{ background: "#ffcc00", color: "#0b0b0b" }}
                data-ocid="materials.open_modal_button"
              >
                <Plus size={14} className="mr-1" /> सामग्री जोड़ें
              </Button>
            </DialogTrigger>
            <DialogContent
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            >
              <DialogHeader>
                <DialogTitle style={{ color: "#ffcc00" }}>
                  नई सामग्री जोड़ें
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label style={{ color: "#cfcfcf" }}>नाम</Label>
                  <Input
                    value={matForm.name}
                    onChange={(e) =>
                      setMatForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="जैसे: बालू, गिट्टी"
                    style={{
                      background: "#0b0b0b",
                      color: "#fff",
                      border: "1px solid #2a2a2a",
                    }}
                    data-ocid="materials.input"
                  />
                </div>
                <div>
                  <Label style={{ color: "#cfcfcf" }}>मात्रा</Label>
                  <Input
                    type="number"
                    value={matForm.quantity}
                    onChange={(e) =>
                      setMatForm((p) => ({ ...p, quantity: e.target.value }))
                    }
                    placeholder="0"
                    style={{
                      background: "#0b0b0b",
                      color: "#fff",
                      border: "1px solid #2a2a2a",
                    }}
                    data-ocid="materials.input"
                  />
                </div>
                <div>
                  <Label style={{ color: "#cfcfcf" }}>इकाई</Label>
                  <Input
                    value={matForm.unit}
                    onChange={(e) =>
                      setMatForm((p) => ({ ...p, unit: e.target.value }))
                    }
                    placeholder="KG / Ton / Pieces"
                    style={{
                      background: "#0b0b0b",
                      color: "#fff",
                      border: "1px solid #2a2a2a",
                    }}
                    data-ocid="materials.input"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => addMat.mutate()}
                  disabled={addMat.isPending || !matForm.name}
                  style={{ background: "#ffcc00", color: "#0b0b0b" }}
                  data-ocid="materials.submit_button"
                >
                  {addMat.isPending ? (
                    <Loader2 size={14} className="animate-spin mr-1" />
                  ) : null}
                  जोड़ें
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loadMat ? (
          <div
            className="flex justify-center py-6"
            data-ocid="materials.loading_state"
          >
            <Loader2 className="animate-spin" style={{ color: "#ffcc00" }} />
          </div>
        ) : materials.length === 0 ? (
          <div
            className="text-center py-6 rounded-xl"
            style={{ background: "#1a1a1a", color: "#555" }}
            data-ocid="materials.empty_state"
          >
            कोई सामग्री नहीं है
          </div>
        ) : (
          <div className="space-y-2">
            {materials.map((m, i) => (
              <div
                key={String(m.id)}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
                data-ocid={`materials.item.${i + 1}`}
              >
                <div>
                  <p className="font-semibold" style={{ color: "#fff" }}>
                    {m.name}
                  </p>
                  <p className="text-xs" style={{ color: "#888" }}>
                    {String(m.quantity)} {m.unit}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditMat(m)}
                    style={{ color: "#ffcc00" }}
                    data-ocid={`materials.edit_button.${i + 1}`}
                  >
                    <Edit2 size={14} />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        style={{ color: "#ff4444" }}
                        data-ocid={`materials.delete_button.${i + 1}`}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent
                      style={{
                        background: "#1a1a1a",
                        border: "1px solid #2a2a2a",
                      }}
                    >
                      <AlertDialogHeader>
                        <AlertDialogTitle style={{ color: "#fff" }}>
                          क्या हटाना है?
                        </AlertDialogTitle>
                        <AlertDialogDescription style={{ color: "#888" }}>
                          यह सामग्री हमेशा के लिए हट जाएगी।
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          style={{ background: "#2a2a2a", color: "#fff" }}
                          data-ocid={`materials.cancel_button.${i + 1}`}
                        >
                          रद्द करें
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMat.mutate(m.id)}
                          style={{ background: "#ff4444", color: "#fff" }}
                          data-ocid={`materials.confirm_button.${i + 1}`}
                        >
                          हाँ, हटाएं
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Material Dialog */}
      <Dialog open={!!editMat} onOpenChange={(o) => !o && setEditMat(null)}>
        <DialogContent
          style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#ffcc00" }}>
              सामग्री अपडेट करें
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label style={{ color: "#cfcfcf" }}>नाम</Label>
              <Input
                value={matForm.name}
                onChange={(e) =>
                  setMatForm((p) => ({ ...p, name: e.target.value }))
                }
                style={{
                  background: "#0b0b0b",
                  color: "#fff",
                  border: "1px solid #2a2a2a",
                }}
                data-ocid="materials.edit.input"
              />
            </div>
            <div>
              <Label style={{ color: "#cfcfcf" }}>मात्रा</Label>
              <Input
                type="number"
                value={matForm.quantity}
                onChange={(e) =>
                  setMatForm((p) => ({ ...p, quantity: e.target.value }))
                }
                style={{
                  background: "#0b0b0b",
                  color: "#fff",
                  border: "1px solid #2a2a2a",
                }}
                data-ocid="materials.edit.input"
              />
            </div>
            <div>
              <Label style={{ color: "#cfcfcf" }}>इकाई</Label>
              <Input
                value={matForm.unit}
                onChange={(e) =>
                  setMatForm((p) => ({ ...p, unit: e.target.value }))
                }
                style={{
                  background: "#0b0b0b",
                  color: "#fff",
                  border: "1px solid #2a2a2a",
                }}
                data-ocid="materials.edit.input"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => editMat && updateMat.mutate(editMat)}
              disabled={updateMat.isPending}
              style={{ background: "#ffcc00", color: "#0b0b0b" }}
              data-ocid="materials.save_button"
            >
              {updateMat.isPending ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : null}
              सेव करें
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deliveries */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold" style={{ color: "#ffcc00" }}>
            🚛 डिलीवरी रिकॉर्ड
          </h3>
          <Dialog open={addDelOpen} onOpenChange={setAddDelOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                style={{
                  background: "#1a1a1a",
                  color: "#ffcc00",
                  border: "1px solid #ffcc00",
                }}
                data-ocid="deliveries.open_modal_button"
              >
                <Plus size={14} className="mr-1" /> डिलीवरी जोड़ें
              </Button>
            </DialogTrigger>
            <DialogContent
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            >
              <DialogHeader>
                <DialogTitle style={{ color: "#ffcc00" }}>
                  नई डिलीवरी
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label style={{ color: "#cfcfcf" }}>ग्राहक का नाम</Label>
                  <Input
                    value={delForm.customerName}
                    onChange={(e) =>
                      setDelForm((p) => ({
                        ...p,
                        customerName: e.target.value,
                      }))
                    }
                    style={{
                      background: "#0b0b0b",
                      color: "#fff",
                      border: "1px solid #2a2a2a",
                    }}
                    data-ocid="deliveries.input"
                  />
                </div>
                <div>
                  <Label style={{ color: "#cfcfcf" }}>सामग्री</Label>
                  <Select
                    onValueChange={(v) =>
                      setDelForm((p) => ({ ...p, materialId: v }))
                    }
                  >
                    <SelectTrigger
                      style={{
                        background: "#0b0b0b",
                        color: "#fff",
                        border: "1px solid #2a2a2a",
                      }}
                      data-ocid="deliveries.select"
                    >
                      <SelectValue placeholder="सामग्री चुनें" />
                    </SelectTrigger>
                    <SelectContent
                      style={{
                        background: "#1a1a1a",
                        border: "1px solid #2a2a2a",
                      }}
                    >
                      {materials.map((m) => (
                        <SelectItem
                          key={String(m.id)}
                          value={String(m.id)}
                          style={{ color: "#fff" }}
                        >
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label style={{ color: "#cfcfcf" }}>मात्रा</Label>
                  <Input
                    type="number"
                    value={delForm.quantity}
                    onChange={(e) =>
                      setDelForm((p) => ({ ...p, quantity: e.target.value }))
                    }
                    style={{
                      background: "#0b0b0b",
                      color: "#fff",
                      border: "1px solid #2a2a2a",
                    }}
                    data-ocid="deliveries.input"
                  />
                </div>
                <div>
                  <Label style={{ color: "#cfcfcf" }}>कीमत (₹)</Label>
                  <Input
                    type="number"
                    value={delForm.price}
                    onChange={(e) =>
                      setDelForm((p) => ({ ...p, price: e.target.value }))
                    }
                    style={{
                      background: "#0b0b0b",
                      color: "#fff",
                      border: "1px solid #2a2a2a",
                    }}
                    data-ocid="deliveries.input"
                  />
                </div>
                <div>
                  <Label style={{ color: "#cfcfcf" }}>नोट्स</Label>
                  <Textarea
                    value={delForm.notes}
                    onChange={(e) =>
                      setDelForm((p) => ({ ...p, notes: e.target.value }))
                    }
                    style={{
                      background: "#0b0b0b",
                      color: "#fff",
                      border: "1px solid #2a2a2a",
                    }}
                    data-ocid="deliveries.textarea"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => addDel.mutate()}
                  disabled={addDel.isPending || !delForm.customerName}
                  style={{ background: "#ffcc00", color: "#0b0b0b" }}
                  data-ocid="deliveries.submit_button"
                >
                  {addDel.isPending ? (
                    <Loader2 size={14} className="animate-spin mr-1" />
                  ) : null}
                  जोड़ें
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loadDel ? (
          <div
            className="flex justify-center py-4"
            data-ocid="deliveries.loading_state"
          >
            <Loader2 className="animate-spin" style={{ color: "#ffcc00" }} />
          </div>
        ) : deliveries.length === 0 ? (
          <div
            className="text-center py-4 rounded-xl"
            style={{ background: "#1a1a1a", color: "#555" }}
            data-ocid="deliveries.empty_state"
          >
            कोई डिलीवरी नहीं
          </div>
        ) : (
          <div className="space-y-2">
            {deliveries.map((d, i) => (
              <div
                key={String(d.id)}
                className="px-4 py-3 rounded-xl"
                style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
                data-ocid={`deliveries.item.${i + 1}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold" style={{ color: "#fff" }}>
                      {d.customerName}
                    </p>
                    <p className="text-xs" style={{ color: "#888" }}>
                      {d.materialName} — {String(d.quantity)} unit — ₹
                      {String(d.price)}
                    </p>
                    <p className="text-xs" style={{ color: "#555" }}>
                      {formatDate(d.date)}
                      {d.notes ? ` • ${d.notes}` : ""}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        style={{ color: "#ff4444" }}
                        data-ocid={`deliveries.delete_button.${i + 1}`}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent
                      style={{
                        background: "#1a1a1a",
                        border: "1px solid #2a2a2a",
                      }}
                    >
                      <AlertDialogHeader>
                        <AlertDialogTitle style={{ color: "#fff" }}>
                          हटाना है?
                        </AlertDialogTitle>
                        <AlertDialogDescription style={{ color: "#888" }}>
                          डिलीवरी रिकॉर्ड हट जाएगा।
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          style={{ background: "#2a2a2a", color: "#fff" }}
                          data-ocid={`deliveries.cancel_button.${i + 1}`}
                        >
                          रद्द
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteDel.mutate(d.id)}
                          style={{ background: "#ff4444", color: "#fff" }}
                          data-ocid={`deliveries.confirm_button.${i + 1}`}
                        >
                          हटाएं
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Payments Tab ─────────────────────────────────────────────────────────────
function PaymentsTab() {
  const { actor } = useActor();
  const qc = useQueryClient();

  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ["payments"],
    queryFn: () => (actor as unknown as InventoryActor).getAllPayments(),
    enabled: !!actor,
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    amount: "",
    isPaid: false,
    phoneNumber: "",
  });

  const addPayment = useMutation({
    mutationFn: () =>
      (actor as unknown as InventoryActor).addPayment({
        id: BigInt(0),
        customerName: form.customerName,
        amount: BigInt(form.amount || 0),
        isPaid: form.isPaid,
        date: nowNano(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      setOpen(false);
      setForm({ customerName: "", amount: "", isPaid: false, phoneNumber: "" });
      toast.success("भुगतान जोड़ा गया!");
    },
    onError: () => toast.error("Error adding payment"),
  });

  const togglePaid = useMutation({
    mutationFn: (p: Payment) =>
      (actor as unknown as InventoryActor).updatePayment(p.id, {
        ...p,
        isPaid: !p.isPaid,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
    onError: () => toast.error("Error updating"),
  });

  const deletePayment = useMutation({
    mutationFn: (id: bigint) =>
      (actor as unknown as InventoryActor).deletePayment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast.success("हटा दिया!");
    },
    onError: () => toast.error("Error deleting"),
  });

  // phoneNumbers stored locally keyed by payment id (since backend doesn't store it)
  const [phoneMap, setPhoneMap] = useState<Record<string, string>>({});

  function sendWhatsApp(p: Payment, phone: string) {
    const ph = phone.replace(/\D/g, "");
    const msg = `नमस्ते ${p.customerName} जी, Star Construction में आपका ₹${String(p.amount)} का भुगतान बकाया है। कृपया जल्द भुगतान करें। धन्यवाद।`;
    window.open(
      `https://wa.me/91${ph}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold" style={{ color: "#ffcc00" }}>
          💰 भुगतान रिकॉर्ड
        </h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              style={{ background: "#ffcc00", color: "#0b0b0b" }}
              data-ocid="payments.open_modal_button"
            >
              <Plus size={14} className="mr-1" /> भुगतान जोड़ें
            </Button>
          </DialogTrigger>
          <DialogContent
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: "#ffcc00" }}>नया भुगतान</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label style={{ color: "#cfcfcf" }}>ग्राहक का नाम</Label>
                <Input
                  value={form.customerName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, customerName: e.target.value }))
                  }
                  style={{
                    background: "#0b0b0b",
                    color: "#fff",
                    border: "1px solid #2a2a2a",
                  }}
                  data-ocid="payments.input"
                />
              </div>
              <div>
                <Label style={{ color: "#cfcfcf" }}>राशि (₹)</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, amount: e.target.value }))
                  }
                  style={{
                    background: "#0b0b0b",
                    color: "#fff",
                    border: "1px solid #2a2a2a",
                  }}
                  data-ocid="payments.input"
                />
              </div>
              <div>
                <Label style={{ color: "#cfcfcf" }}>
                  WhatsApp नंबर (रिमाइंडर के लिए)
                </Label>
                <Input
                  value={form.phoneNumber}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phoneNumber: e.target.value }))
                  }
                  placeholder="10 अंक"
                  style={{
                    background: "#0b0b0b",
                    color: "#fff",
                    border: "1px solid #2a2a2a",
                  }}
                  data-ocid="payments.input"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isPaid"
                  checked={form.isPaid}
                  onCheckedChange={(v) =>
                    setForm((p) => ({ ...p, isPaid: !!v }))
                  }
                  data-ocid="payments.checkbox"
                />
                <Label htmlFor="isPaid" style={{ color: "#cfcfcf" }}>
                  भुगतान हो गया
                </Label>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  if (form.phoneNumber) {
                    setPhoneMap((prev) => ({
                      ...prev,
                      pending: form.phoneNumber,
                    }));
                  }
                  addPayment.mutate();
                }}
                disabled={addPayment.isPending || !form.customerName}
                style={{ background: "#ffcc00", color: "#0b0b0b" }}
                data-ocid="payments.submit_button"
              >
                {addPayment.isPending ? (
                  <Loader2 size={14} className="animate-spin mr-1" />
                ) : null}
                जोड़ें
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div
          className="flex justify-center py-6"
          data-ocid="payments.loading_state"
        >
          <Loader2 className="animate-spin" style={{ color: "#ffcc00" }} />
        </div>
      ) : payments.length === 0 ? (
        <div
          className="text-center py-6 rounded-xl"
          style={{ background: "#1a1a1a", color: "#555" }}
          data-ocid="payments.empty_state"
        >
          कोई भुगतान नहीं
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((p, i) => (
            <div
              key={String(p.id)}
              className="px-4 py-3 rounded-xl"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
              data-ocid={`payments.item.${i + 1}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold" style={{ color: "#fff" }}>
                      {p.customerName}
                    </p>
                    <Badge
                      style={
                        p.isPaid
                          ? { background: "#16a34a", color: "#fff" }
                          : { background: "#dc2626", color: "#fff" }
                      }
                      data-ocid={`payments.item.${i + 1}`}
                    >
                      {p.isPaid ? "✓ पेड" : "बकाया"}
                    </Badge>
                  </div>
                  <p className="text-sm font-bold" style={{ color: "#ffcc00" }}>
                    ₹{String(p.amount)}
                  </p>
                  <p className="text-xs" style={{ color: "#555" }}>
                    {formatDate(p.date)}
                  </p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => togglePaid.mutate(p)}
                    style={{
                      color: p.isPaid ? "#888" : "#16a34a",
                      fontSize: "11px",
                    }}
                    data-ocid={`payments.toggle.${i + 1}`}
                  >
                    <Check size={12} className="mr-1" />
                    {p.isPaid ? "अनपेड" : "पेड करें"}
                  </Button>
                  {!p.isPaid && (
                    <div className="flex items-center gap-1">
                      <Input
                        placeholder="नंबर"
                        value={phoneMap[String(p.id)] || ""}
                        onChange={(e) =>
                          setPhoneMap((prev) => ({
                            ...prev,
                            [String(p.id)]: e.target.value,
                          }))
                        }
                        style={{
                          background: "#0b0b0b",
                          color: "#fff",
                          border: "1px solid #2a2a2a",
                          height: "28px",
                          fontSize: "11px",
                          width: "90px",
                        }}
                        data-ocid={`payments.input.${i + 1}`}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          sendWhatsApp(p, phoneMap[String(p.id)] || "")
                        }
                        disabled={!phoneMap[String(p.id)]}
                        style={{ color: "#25D366", padding: "4px" }}
                        data-ocid={`payments.whatsapp_button.${i + 1}`}
                      >
                        <MessageCircle size={14} />
                      </Button>
                    </div>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        style={{ color: "#ff4444" }}
                        data-ocid={`payments.delete_button.${i + 1}`}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent
                      style={{
                        background: "#1a1a1a",
                        border: "1px solid #2a2a2a",
                      }}
                    >
                      <AlertDialogHeader>
                        <AlertDialogTitle style={{ color: "#fff" }}>
                          हटाना है?
                        </AlertDialogTitle>
                        <AlertDialogDescription style={{ color: "#888" }}>
                          यह भुगतान रिकॉर्ड हट जाएगा।
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          style={{ background: "#2a2a2a", color: "#fff" }}
                          data-ocid={`payments.cancel_button.${i + 1}`}
                        >
                          रद्द
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deletePayment.mutate(p.id)}
                          style={{ background: "#ff4444", color: "#fff" }}
                          data-ocid={`payments.confirm_button.${i + 1}`}
                        >
                          हटाएं
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Machine Bookings Tab ─────────────────────────────────────────────────────
function MachineBookingsTab() {
  const { actor } = useActor();
  const qc = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery<MachineBooking[]>({
    queryKey: ["machineBookings"],
    queryFn: () => (actor as unknown as InventoryActor).getAllMachineBookings(),
    enabled: !!actor,
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    machineType: "JCB",
    customerName: "",
    bookingDate: "",
  });

  const addBooking = useMutation({
    mutationFn: () =>
      (actor as unknown as InventoryActor).addMachineBooking({
        id: BigInt(0),
        machineType: form.machineType,
        customerName: form.customerName,
        bookingDate: form.bookingDate
          ? BigInt(new Date(form.bookingDate).getTime()) * BigInt(1_000_000)
          : nowNano(),
        isCompleted: false,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["machineBookings"] });
      setOpen(false);
      setForm({ machineType: "JCB", customerName: "", bookingDate: "" });
      toast.success("बुकिंग जोड़ी गई!");
    },
    onError: () => toast.error("Error adding booking"),
  });

  const completeBooking = useMutation({
    mutationFn: (id: bigint) =>
      (actor as unknown as InventoryActor).completeMachineBooking(
        id,
        nowNano(),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["machineBookings"] });
      toast.success("पूर्ण किया!");
    },
    onError: () => toast.error("Error completing booking"),
  });

  const deleteBooking = useMutation({
    mutationFn: (b: MachineBooking) =>
      (actor as unknown as InventoryActor).updateMachineBooking(b.id, {
        ...b,
        isCompleted: true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["machineBookings"] });
      toast.success("हटा दिया!");
    },
  });

  const active = bookings.filter((b) => !b.isCompleted);
  const completed = bookings.filter((b) => b.isCompleted);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold" style={{ color: "#ffcc00" }}>
          🚜 मशीन बुकिंग
        </h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              style={{ background: "#ffcc00", color: "#0b0b0b" }}
              data-ocid="bookings.open_modal_button"
            >
              <Plus size={14} className="mr-1" /> बुकिंग जोड़ें
            </Button>
          </DialogTrigger>
          <DialogContent
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: "#ffcc00" }}>
                नई मशीन बुकिंग
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label style={{ color: "#cfcfcf" }}>मशीन</Label>
                <Select
                  value={form.machineType}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, machineType: v }))
                  }
                >
                  <SelectTrigger
                    style={{
                      background: "#0b0b0b",
                      color: "#fff",
                      border: "1px solid #2a2a2a",
                    }}
                    data-ocid="bookings.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      background: "#1a1a1a",
                      border: "1px solid #2a2a2a",
                    }}
                  >
                    <SelectItem value="JCB" style={{ color: "#fff" }}>
                      🚜 JCB
                    </SelectItem>
                    <SelectItem value="Tractor" style={{ color: "#fff" }}>
                      🚛 Tractor
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label style={{ color: "#cfcfcf" }}>ग्राहक का नाम</Label>
                <Input
                  value={form.customerName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, customerName: e.target.value }))
                  }
                  style={{
                    background: "#0b0b0b",
                    color: "#fff",
                    border: "1px solid #2a2a2a",
                  }}
                  data-ocid="bookings.input"
                />
              </div>
              <div>
                <Label style={{ color: "#cfcfcf" }}>बुकिंग तारीख</Label>
                <Input
                  type="date"
                  value={form.bookingDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, bookingDate: e.target.value }))
                  }
                  style={{
                    background: "#0b0b0b",
                    color: "#fff",
                    border: "1px solid #2a2a2a",
                  }}
                  data-ocid="bookings.input"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => addBooking.mutate()}
                disabled={addBooking.isPending || !form.customerName}
                style={{ background: "#ffcc00", color: "#0b0b0b" }}
                data-ocid="bookings.submit_button"
              >
                {addBooking.isPending ? (
                  <Loader2 size={14} className="animate-spin mr-1" />
                ) : null}
                जोड़ें
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: "#888" }}>
          चल रही बुकिंग ({active.length})
        </p>
        {isLoading ? (
          <div
            className="flex justify-center py-4"
            data-ocid="bookings.loading_state"
          >
            <Loader2 className="animate-spin" style={{ color: "#ffcc00" }} />
          </div>
        ) : active.length === 0 ? (
          <div
            className="text-center py-4 rounded-xl"
            style={{ background: "#1a1a1a", color: "#555" }}
            data-ocid="bookings.empty_state"
          >
            कोई बुकिंग नहीं
          </div>
        ) : (
          <div className="space-y-2">
            {active.map((b, i) => (
              <div
                key={String(b.id)}
                className="px-4 py-3 rounded-xl"
                style={{ background: "#1a1a1a", border: "1px solid #ffcc0033" }}
                data-ocid={`bookings.item.${i + 1}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold" style={{ color: "#fff" }}>
                      {b.machineType === "JCB" ? "🚜" : "🚛"} {b.machineType} —{" "}
                      {b.customerName}
                    </p>
                    <p className="text-xs" style={{ color: "#888" }}>
                      {formatDate(b.bookingDate)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={() => completeBooking.mutate(b.id)}
                      disabled={completeBooking.isPending}
                      style={{
                        background: "#16a34a",
                        color: "#fff",
                        fontSize: "11px",
                      }}
                      data-ocid={`bookings.complete_button.${i + 1}`}
                    >
                      <Check size={12} className="mr-1" /> पूर्ण
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          style={{ color: "#ff4444" }}
                          data-ocid={`bookings.delete_button.${i + 1}`}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent
                        style={{
                          background: "#1a1a1a",
                          border: "1px solid #2a2a2a",
                        }}
                      >
                        <AlertDialogHeader>
                          <AlertDialogTitle style={{ color: "#fff" }}>
                            हटाना है?
                          </AlertDialogTitle>
                          <AlertDialogDescription style={{ color: "#888" }}>
                            यह बुकिंग हट जाएगी।
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            style={{ background: "#2a2a2a", color: "#fff" }}
                            data-ocid={`bookings.cancel_button.${i + 1}`}
                          >
                            रद्द
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteBooking.mutate(b)}
                            style={{ background: "#ff4444", color: "#fff" }}
                            data-ocid={`bookings.confirm_button.${i + 1}`}
                          >
                            हटाएं
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {completed.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: "#888" }}>
            पूर्ण हुई बुकिंग ({completed.length})
          </p>
          <div className="space-y-2">
            {completed.map((b, i) => (
              <div
                key={String(b.id)}
                className="px-4 py-3 rounded-xl opacity-60"
                style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
                data-ocid={`bookings.completed.item.${i + 1}`}
              >
                <p className="font-semibold text-sm" style={{ color: "#fff" }}>
                  {b.machineType === "JCB" ? "🚜" : "🚛"} {b.machineType} —{" "}
                  {b.customerName}
                </p>
                <p className="text-xs" style={{ color: "#888" }}>
                  {formatDate(b.bookingDate)}
                  {b.returnDate ? ` → ${formatDate(b.returnDate)}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
interface InventoryDashboardProps {
  onClose: () => void;
}

export function InventoryDashboard({ onClose }: InventoryDashboardProps) {
  return (
    <div
      className="fixed inset-0 overflow-y-auto"
      style={{ background: "#0b0b0b", zIndex: 200 }}
      data-ocid="inventory.panel"
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 h-14"
        style={{ background: "#111111", borderBottom: "1px solid #222" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold" style={{ color: "#ffcc00" }}>
            📊
          </span>
          <span className="font-bold" style={{ color: "#fff" }}>
            Inventory Dashboard
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg transition-colors hover:bg-white/10"
          style={{ color: "#cfcfcf" }}
          aria-label="Close"
          data-ocid="inventory.close_button"
        >
          <X size={22} />
        </button>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Tabs defaultValue="materials">
          <TabsList className="w-full mb-6" style={{ background: "#1a1a1a" }}>
            <TabsTrigger
              value="materials"
              className="flex-1"
              style={{ color: "#cfcfcf" }}
              data-ocid="inventory.materials.tab"
            >
              📦 सामग्री
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="flex-1"
              style={{ color: "#cfcfcf" }}
              data-ocid="inventory.payments.tab"
            >
              💰 भुगतान
            </TabsTrigger>
            <TabsTrigger
              value="bookings"
              className="flex-1"
              style={{ color: "#cfcfcf" }}
              data-ocid="inventory.bookings.tab"
            >
              🚜 बुकिंग
            </TabsTrigger>
          </TabsList>
          <TabsContent value="materials">
            <MaterialsTab />
          </TabsContent>
          <TabsContent value="payments">
            <PaymentsTab />
          </TabsContent>
          <TabsContent value="bookings">
            <MachineBookingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
