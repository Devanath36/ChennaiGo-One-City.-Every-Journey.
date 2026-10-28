import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import {
  getTransitLines,
  getAllStations,
  getStationById,
  getConnections,
  findJourneyRoute,
  findJourneyAlternatives,
  smartAssistantQuery,
  getActiveTrains,
  saveUserJourney,
  getUserSavedJourneys,
  getSystemStats,
  getDataSources
} from './src/server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolvePort(): number {
  const portIndex = process.argv.indexOf('--port');
  if (portIndex !== -1 && process.argv[portIndex + 1]) {
    const parsed = Number(process.argv[portIndex + 1]);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  if (process.env.NODE_ENV !== 'production') {
    return 3000;
  }
  return Number(process.env.PORT) || 3000;
}

async function startServer() {
  const app = express();
  const PORT = resolvePort();

  app.use(express.json());

  // API Router
  const api = express.Router();

  // Health and System Stats
  api.get('/health', (req, res) => {
    try {
      const stats = getSystemStats();
      res.json({
        success: true,
        service: 'Chennai Transit 3D API',
        timestamp: new Date().toISOString(),
        ...stats
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Transit Lines (supports status filter)
  api.get('/lines', (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const lines = getTransitLines(status);
      res.json({ success: true, count: lines.length, data: lines });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Transit Data Sources Registry (supports category filter)
  api.get('/sources', (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const sources = getDataSources(category);
      res.json({ success: true, count: sources.length, data: sources });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Stations (supports line, search, and status filters)
  api.get('/stations', (req, res) => {
    try {
      const lineId = req.query.line as string | undefined;
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const stations = getAllStations(lineId, search, status);
      res.json({ success: true, count: stations.length, data: stations });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Single Station
  api.get('/stations/:id', (req, res) => {
    try {
      const station = getStationById(req.params.id);
      if (!station) {
        return res.status(404).json({ success: false, error: 'Station not found with given ID' });
      }
      res.json({ success: true, data: station });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Connections
  api.get('/connections', (req, res) => {
    try {
      const connections = getConnections();
      res.json({ success: true, count: connections.length, data: connections });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Journey Planner (Verified routing)
  api.post('/journey/plan', (req, res) => {
    try {
      const { origin_id, dest_id, preference } = req.body;
      if (!origin_id || !dest_id) {
        return res.status(400).json({
          success: false,
          error: 'Both origin_id and dest_id are required in the request body.'
        });
      }

      const options = findJourneyAlternatives(origin_id, dest_id, preference);
      if (!options || options.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No connected transit route found between the selected stations in the network database.'
        });
      }

      res.json({ success: true, data: options[0], options });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Smart Transport Assistant (Natural query processing)
  api.post('/journey/assist', (req, res) => {
    try {
      const { query, preference } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Query string is required in the request body.'
        });
      }

      const result = smartAssistantQuery(query, preference);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Live / Simulated Train Tracking
  api.get('/trains/live', (req, res) => {
    try {
      const trains = getActiveTrains();
      res.json({
        success: true,
        is_live_hardware_connected: false,
        tracking_mode: 'SCHEDULE_BASED_SIMULATION',
        disclaimer: 'Live GPS feeds from CMRL/Southern Railways are restricted to internal control operations. These positions are simulated in real-time according to official published timetables, headway frequencies, and calibrated station running speeds for operational corridors.',
        count: trains.length,
        data: trains
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Saved Journeys (Public, no login required)
  api.get('/saved-journeys', (req, res) => {
    try {
      const journeys = getUserSavedJourneys();
      res.json({ success: true, count: journeys.length, data: journeys });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  api.post('/saved-journeys', (req, res) => {
    try {
      const { origin_id, dest_id } = req.body;
      if (!origin_id || !dest_id) {
        return res.status(400).json({ success: false, error: 'origin_id and dest_id are required' });
      }
      const result = saveUserJourney(origin_id, dest_id);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.use('/api', api);

  // Serve static files in production, or mount Vite middleware in development
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Chennai Transit] Full-Stack server running at http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    console.error('[Server Error]:', err);
    if (err.code === 'EADDRINUSE' && PORT !== 3000) {
      console.log('[Server] Retrying listen on port 3000...');
      app.listen(3000, '0.0.0.0', () => {
        console.log(`[Chennai Transit] Full-Stack server running at http://0.0.0.0:3000`);
      });
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
