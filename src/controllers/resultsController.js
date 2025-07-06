import Results from '../models/Results.js';

// Récupérer la moyenne des notes pour chaque matière de l'utilisateur connecté
export async function getMoyenneParMatiere(req, res) {
  try {
    const userId = req.user.id || req.user._id; // selon comment l'id est stocké

    // Agrégation pour calculer la moyenne par matière
    const moyennes = await Results.aggregate([
      { $match: { user_id: typeof userId === 'string' ? new Results.collection.db.bson_serializer.ObjectID(userId) : userId } },
      { $group: { _id: "$matiere", moyenne: { $avg: "$note" } } }
    ]);

    res.json(moyennes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getResultsByUser(req, res) {
    try {
        const userId = req.user.userId || req.user.id || req.user._id;
        const results = await Results.find({ user_id: userId });
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
