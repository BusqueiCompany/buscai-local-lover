// src/hooks/useEntregador.ts
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  runTransaction,
  query,
  where,
  collection
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useEntregadorContext } from "@/contexts/EntregadorContext";

export function useEntregador() {
  const { user } = useAuth();
  const { online, location } = useEntregadorContext();
  const [pedidosDisponiveis, setPedidosDisponiveis] = useState<any[]>([]);
  const [pedidoAtual, setPedidoAtual] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!online) return;

    const q = query(
      collection(db, "pedidos"),
      where("status", "==", "NOVO")
    );

    const unsub = onSnapshot(q, snap => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPedidosDisponiveis(items);
    });

    return () => unsub();
  }, [online]);

  const aceitarPedido = async (pedidoId: string) => {
    if (!user) return;

    setLoading(true);

    const pedidoRef = doc(db, "pedidos", pedidoId);

    try {
      await runTransaction(db, async tx => {
        const snap = await tx.get(pedidoRef);
        if (!snap.exists()) throw new Error("Pedido não encontrado");

        const data = snap.data();
        if (data.status !== "NOVO") {
          throw new Error("Pedido já foi aceito por outro entregador");
        }

        tx.update(pedidoRef, {
          status: "ACEITO",
          entregadorId: user.id,
          aceitoEm: new Date(),
        });
      });

      const pedidoSnap = await getDoc(pedidoRef);
      setPedidoAtual({ id: pedidoId, ...pedidoSnap.data() });
    } catch (err) {
      console.error("Falha ao aceitar:", err);
      alert("Outro entregador já aceitou este pedido.");
    }

    setLoading(false);
  };

  const atualizarStatus = async (novoStatus: string) => {
    if (!pedidoAtual) return;

    await updateDoc(doc(db, "pedidos", pedidoAtual.id), {
      status: novoStatus,
      atualizadoEm: new Date(),
      entregadorLocation: location ?? null
    });

    setPedidoAtual(prev => prev ? { ...prev, status: novoStatus } : null);
  };

  return {
    pedidosDisponiveis,
    pedidoAtual,
    aceitarPedido,
    atualizarStatus,
    loading
  };
}
