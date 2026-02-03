import React, { useState, useEffect, useRef } from 'react';
import { VStack, Box, HStack, Button, Text, Badge, Grid, GridItem } from '@chakra-ui/react';
import { API_CORE_URL } from '../../../utils/paths';

function LogsTab() {
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const logsEndRef = useRef(null);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${API_CORE_URL}/logs`);
      const data = await response.json();

      // Deep copy to prevent mutation
      const logsCopy = (data.logs || []).map(log => ({
        ...log,
        timestamp: log.timestamp,
        message: log.message,
        type: log.type,
        method: log.method,
        path: log.path,
        status: log.status,
        duration: log.duration,
        responseBody: log.responseBody
      }));

      setLogs(logsCopy);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const clearLogs = async () => {
    try {
      setIsLoading(true);
      await fetch(`${API_CORE_URL}/logs`, { method: 'DELETE' });
      setLogs([]);
      setSelectedLog(null); // Clear selected request
    } catch (error) {
      console.error('Failed to clear logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadLogs = () => {
    const logText = logs.map(log => `${log.timestamp} | ${log.message}`).join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mocktail-logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Fetch logs on mount and when tab becomes visible
  useEffect(() => {
    // Fetch immediately when component mounts
    fetchLogs();

    // Set up polling only when tab is visible
    const interval = setInterval(() => {
      // Check if document/tab is visible
      if (!document.hidden) {
        fetchLogs();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Auto-select latest request when logs update
  useEffect(() => {
    const requestLogs = logs.filter(log => log.type === 'request');
    if (requestLogs.length > 0 && !selectedLog) {
      setSelectedLog(requestLogs[requestLogs.length - 1]);
    }
  }, [logs]);

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET': return 'green';
      case 'POST': return 'blue';
      case 'PUT': return 'orange';
      case 'PATCH': return 'purple';
      case 'DELETE': return 'red';
      default: return 'gray';
    }
  };

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'green';
    if (status >= 300 && status < 400) return 'blue';
    if (status >= 400 && status < 500) return 'orange';
    if (status >= 500) return 'red';
    return 'gray';
  };

  const copyResponse = () => {
    if (selectedLog?.responseBody) {
      navigator.clipboard.writeText(selectedLog.responseBody);
    }
  };

  const downloadResponse = () => {
    if (!selectedLog?.responseBody) return;
    const blob = new Blob([selectedLog.responseBody], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response-${selectedLog.timestamp.replace(/[:\s]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const requestLogs = logs.filter(log => log.type === 'request');
  const systemLogs = logs.filter(log => log.type !== 'request');

  return (
    <VStack align="stretch" gap={4}>
      {/* Header */}
      <HStack justify="space-between">
        <HStack gap={2}>
          <Text fontSize="xl" fontWeight="bold">
            Backend Logs
          </Text>
          <Badge size="sm" colorPalette="blue" variant="subtle">
            {requestLogs.length} requests
          </Badge>
          {systemLogs.length > 0 && (
            <Badge size="sm" colorPalette="gray" variant="subtle">
              {systemLogs.length} system
            </Badge>
          )}
        </HStack>

        <HStack gap={2}>
          <Button
            size="sm"
            variant="outline"
            onClick={clearLogs}
            disabled={logs.length === 0 || isLoading}
            colorPalette="red"
          >
            Clear All
          </Button>
        </HStack>
      </HStack>

      {/* Split View */}
      <Grid templateColumns="1fr 2fr" gap={4} height="500px">
        {/* Left - Request List */}
        <GridItem overflow="hidden">
          <Box height="500px" overflowY="auto" border="1px solid" borderColor="gray.200" borderRadius="md">
            {requestLogs.length === 0 ? (
              <Box p={8} textAlign="center">
                <Text color="gray.500" fontSize="sm">No requests yet</Text>
              </Box>
            ) : (
              requestLogs.slice().reverse().map((log, index) => (
                <Box
                  key={index}
                  p={3}
                  cursor="pointer"
                  bg={selectedLog === log ? 'blue.50' : 'white'}
                  borderBottom="1px solid"
                  borderColor="gray.100"
                  _hover={{ bg: selectedLog === log ? 'blue.50' : 'gray.50' }}
                  onClick={() => setSelectedLog(log)}
                >
                  <HStack gap={2} mb={1}>
                    <Badge size="xs" colorPalette={getMethodColor(log.method)} variant="subtle">
                      {log.method}
                    </Badge>
                    <Badge size="xs" colorPalette={getStatusColor(log.status)} variant="subtle">
                      {log.status}
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" fontFamily="monospace" color="gray.700" noOfLines={1}>
                    {log.path}
                  </Text>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    {log.timestamp} • {log.duration}
                  </Text>
                </Box>
              ))
            )}
          </Box>
        </GridItem>

        {/* Right - Request Details */}
        <GridItem>
          <VStack align="stretch" height="100%" border="1px solid" borderColor="gray.200" borderRadius="md" bg="white">
            {!selectedLog ? (
              <Box p={8} textAlign="center" flex="1" display="flex" alignItems="center" justifyContent="center">
                <Text color="gray.500">Select a request to view details</Text>
              </Box>
            ) : (
              <>
                {/* Request Header */}
                <Box p={4} borderBottom="1px solid" borderColor="gray.200">
                  <HStack gap={2} mb={2}>
                    <Badge colorPalette={getMethodColor(selectedLog.method)}>
                      {selectedLog.method}
                    </Badge>
                    <Text fontSize="sm" fontFamily="monospace" fontWeight="medium">
                      {selectedLog.path}
                    </Text>
                  </HStack>
                  <HStack gap={4} fontSize="xs" color="gray.600">
                    <Text>Status: <Badge size="xs" colorPalette={getStatusColor(selectedLog.status)}>{selectedLog.status}</Badge></Text>
                    <Text>Duration: <Text as="span" fontWeight="medium">{selectedLog.duration}</Text></Text>
                    <Text>{selectedLog.timestamp}</Text>
                  </HStack>
                </Box>

                {/* Response Body */}
                <Box p={4} borderTop="1px solid" borderColor="gray.100">
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      Response Body
                    </Text>
                    {selectedLog.responseBody && (
                      <HStack gap={2}>
                        <Button size="xs" variant="outline" onClick={copyResponse}>
                          Copy
                        </Button>
                        <Button size="xs" variant="outline" onClick={downloadResponse}>
                          Download
                        </Button>
                      </HStack>
                    )}
                  </HStack>

                  <Box
                    bg="gray.900"
                    color="gray.100"
                    p={3}
                    borderRadius="md"
                    fontFamily="monospace"
                    fontSize="xs"
                    overflowY="auto"
                    overflowX="auto"
                    whiteSpace="pre"
                    maxH="320px"
                  >
                    {selectedLog.responseBody ? (
                      (() => {
                        try {
                          // Try to parse and pretty-print JSON
                          const parsed = JSON.parse(selectedLog.responseBody);
                          return JSON.stringify(parsed, null, 2);
                        } catch {
                          // If not JSON, show as-is
                          return selectedLog.responseBody;
                        }
                      })()
                    ) : (
                      <Text color="gray.500">(empty response)</Text>
                    )}
                  </Box>
                </Box>
              </>
            )}
          </VStack>
        </GridItem>
      </Grid>

      {/* Footer Info */}
      <Box>
        <Text fontSize="xs" color="gray.500">
          Logs auto-refresh every 2 seconds. Last 500 entries kept. Click a request to view full response.
        </Text>
      </Box>
    </VStack>
  );
}

export default LogsTab;
