import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, Button } from '@mui/material';

const LOGS_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/logs/openai`
  : 'https://ai-powerpoint-f44a1d57b590.herokuapp.com/api/logs/openai';

const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(LOGS_API_URL);
      if (!res.ok) throw new Error(`Failed to fetch logs: ${res.statusText}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Optionally, refresh logs every 30s
    // const interval = setInterval(fetchLogs, 30000);
    // return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ maxWidth: 900, margin: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        OpenAI Prompt/Response Logs
      </Typography>
      <Button variant="outlined" onClick={fetchLogs} sx={{ mb: 2 }} disabled={loading}>
        Refresh
      </Button>
      {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
      {error && (
        <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>
      )}
      {!loading && logs.length === 0 && !error && (
        <Typography>No logs found.</Typography>
      )}
      {logs.map((log, idx) => (
        <Paper key={idx} sx={{ mb: 3, p: 2, background: '#f8f8f8' }} elevation={2}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Attempt {log.attempt}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>System Prompt:</Typography>
          <Box sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', mb: 1, fontSize: 13, background: '#eee', p: 1, borderRadius: 1 }}>{log.system_prompt}</Box>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>User Prompt:</Typography>
          <Box sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', mb: 1, fontSize: 13, background: '#eee', p: 1, borderRadius: 1 }}>{log.user_prompt}</Box>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Raw Response:</Typography>
          <Box sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 13, background: '#e0f7fa', p: 1, borderRadius: 1 }}>{log.raw_response}</Box>
        </Paper>
      ))}
    </Box>
  );
};

export default LogViewer;
