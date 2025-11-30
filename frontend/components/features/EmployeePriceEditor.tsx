"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/modern";
import { Button } from "@/components/ui";
import { updateAssignment } from "@/lib/api";
import { Edit, Save, X, Star, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface EmployeePriceEditorProps {
  assignmentId: string;
  currentRate: number;
  apartmentPricingType: "shared" | "fixed";
  apartmentBaseRent: number;
  occupants: number;
  onUpdate?: () => void;
}

export function EmployeePriceEditor({
  assignmentId,
  currentRate,
  apartmentPricingType,
  apartmentBaseRent,
  occupants,
  onUpdate
}: EmployeePriceEditorProps) {
  const [customRate, setCustomRate] = useState(currentRate);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const calculatedRate = apartmentPricingType === "shared"
    ? Math.round(apartmentBaseRent / occupants)
    : apartmentBaseRent;

  const isCustom = currentRate !== calculatedRate;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAssignment(assignmentId, {
        custom_monthly_rate: customRate
      });

      toast.success("Precio actualizado correctamente");
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error("Error updating price:", error);
      toast.error("Error al actualizar el precio");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setCustomRate(calculatedRate);
    toast.info("Precio restablecido al cálculo automático");
  };

  return (
    <GlassCard blur="lg" gradient={isCustom ? "from-purple-500/10 to-pink-500/10" : undefined}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">Precio Mensual</h4>
              {isCustom && (
                <div className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 text-xs font-medium flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Personalizado
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Tipo: {apartmentPricingType === "shared" ? "💰 Compartido" : "📌 Fijo"}
              {apartmentPricingType === "shared" && ` (${occupants} personas)`}
            </p>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
          )}
        </div>

        {isEditing ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium mb-2 block">
                Precio Personalizado (¥)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  value={customRate}
                  onChange={(e) => setCustomRate(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ingrese el precio"
                  min="0"
                  step="1000"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Cálculo automático: ¥{calculatedRate.toLocaleString()}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saving || customRate === currentRate}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCustomRate(currentRate);
                  setIsEditing(false);
                }}
                disabled={saving}
              >
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
            </div>

            {isCustom && customRate === currentRate && (
              <Button
                variant="outline"
                onClick={handleReset}
                className="w-full"
                size="sm"
              >
                Restablecer al cálculo automático (¥{calculatedRate.toLocaleString()})
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="text-center p-6 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <p className="text-4xl font-bold text-green-600 mb-2">
              ¥{currentRate.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              por mes • 月額
            </p>
            {isCustom && (
              <p className="text-xs text-purple-600 mt-2">
                (Normalmente sería ¥{calculatedRate.toLocaleString()})
              </p>
            )}
          </div>
        )}

        {/* Info adicional */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
          {apartmentPricingType === "shared" ? (
            <p>
              💡 <strong>Precio Compartido:</strong> El precio se divide entre {occupants} ocupantes.
              Si cambia el número de ocupantes, el precio automático se recalculará.
            </p>
          ) : (
            <p>
              💡 <strong>Precio Fijo:</strong> Cada persona paga la misma cantidad sin importar
              cuántos ocupantes haya en el apartamento.
            </p>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
