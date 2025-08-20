import axios from 'axios';
const DB_SERVICE_URL = 'https://bdd-services-staging-zvtp.onrender.com/api/v1';

// Récupérer la moyenne des notes pour chaque matière de l'utilisateur connecté
export async function getMoyenneParMatiere(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const { data: moyennes } = await axios.get(`${DB_SERVICE_URL}/results/moyenne/${userId}`);
    res.json(moyennes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Récupérer tous les résultats d'un utilisateur
export async function getResultsByUser(req, res) {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const { data: results } = await axios.get(`${DB_SERVICE_URL}/results/user/${userId}`);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Créer un résultat (à utiliser lors de la correction d'un quiz)
export async function createResult(req, res) {
  try {
    const { data: result } = await axios.post(`${DB_SERVICE_URL}/results`, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
