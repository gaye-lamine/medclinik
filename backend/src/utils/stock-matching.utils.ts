export interface StockMatchResult {
  stockItem: any | null;
  stockStatus: 'AVAILABLE' | 'INSUFFICIENT_STOCK' | 'NOT_FOUND';
  availableQuantity: number;
  requiredQuantity: number;
}

/**
 * Source unique de vérité pour la recherche et la correspondance d'un médicament
 * d'ordonnance avec les articles de l'inventaire pharmacie.
 * Utilisée à la fois pour le contrôle d'affichage des badges (findPrescriptionByCode)
 * et pour l'exécution réelle de la délivrance (deliverPrescription).
 */
export function matchMedicineToStock(med: any, stockItems: any[]): StockMatchResult {
  let stockItem: any = null;

  // Priorité 1 : Recherche par ID d'article de stock explicite s'il existe dans le JSON
  if (med.stockItemId) {
    stockItem = stockItems.find((s) => s.id === med.stockItemId);
  }

  // Priorité 2 : Recherche par correspondance du nom exact ou premier mot
  if (!stockItem && med.name) {
    const firstWord = med.name.split(' ')[0].toLowerCase();
    stockItem = stockItems.find((s) => s.name.toLowerCase().includes(firstWord));
  }

  const requiredQuantity = med.quantity ? parseFloat(med.quantity) : 1;
  let stockStatus: 'AVAILABLE' | 'INSUFFICIENT_STOCK' | 'NOT_FOUND' = 'AVAILABLE';
  let availableQuantity = 0;

  if (!stockItem) {
    stockStatus = 'NOT_FOUND';
  } else {
    availableQuantity = stockItem.quantity;
    if (stockItem.quantity < requiredQuantity) {
      stockStatus = 'INSUFFICIENT_STOCK';
    }
  }

  return {
    stockItem,
    stockStatus,
    availableQuantity,
    requiredQuantity,
  };
}
