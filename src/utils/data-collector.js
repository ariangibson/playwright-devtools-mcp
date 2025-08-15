export class ConsoleCollector {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Prevent memory bloat
  }

  addLog(logEntry) {
    this.logs.push({
      ...logEntry,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  getLogs(options = {}) {
    let filteredLogs = this.logs;

    // Filter by log types
    if (options.types && options.types.length > 0) {
      filteredLogs = filteredLogs.filter(log => 
        options.types.includes(log.type)
      );
    }

    // Filter by time range
    if (options.since) {
      filteredLogs = filteredLogs.filter(log => 
        log.timestamp >= options.since
      );
    }

    // Filter by text content
    if (options.contains) {
      const searchTerm = options.contains.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.text.toLowerCase().includes(searchTerm)
      );
    }

    // Limit results
    if (options.limit) {
      filteredLogs = filteredLogs.slice(-options.limit);
    }

    return filteredLogs;
  }

  clearLogs() {
    this.logs = [];
  }

  getStats() {
    const stats = {
      total: this.logs.length,
      byType: {}
    };

    this.logs.forEach(log => {
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
    });

    return stats;
  }
}

export class NetworkCollector {
  constructor() {
    this.requests = [];
    this.maxRequests = 500;
  }

  addRequest(requestData) {
    this.requests.push({
      ...requestData,
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });

    if (this.requests.length > this.maxRequests) {
      this.requests = this.requests.slice(-this.maxRequests);
    }
  }

  getRequests(options = {}) {
    let filteredRequests = this.requests;

    // Filter by status
    if (options.status) {
      if (options.status === 'failed') {
        filteredRequests = filteredRequests.filter(req => 
          req.failed || (req.response && req.response.status >= 400)
        );
      } else if (typeof options.status === 'number') {
        filteredRequests = filteredRequests.filter(req => 
          req.response && req.response.status === options.status
        );
      }
    }

    // Filter by URL pattern
    if (options.urlContains) {
      const pattern = options.urlContains.toLowerCase();
      filteredRequests = filteredRequests.filter(req => 
        req.url.toLowerCase().includes(pattern)
      );
    }

    // Filter by resource type
    if (options.resourceType) {
      filteredRequests = filteredRequests.filter(req => 
        req.resourceType === options.resourceType
      );
    }

    // Filter by time range
    if (options.since) {
      filteredRequests = filteredRequests.filter(req => 
        req.timestamp >= options.since
      );
    }

    // Sort by timestamp (newest first)
    filteredRequests.sort((a, b) => b.timestamp - a.timestamp);

    // Limit results
    if (options.limit) {
      filteredRequests = filteredRequests.slice(0, options.limit);
    }

    return filteredRequests;
  }

  clearRequests() {
    this.requests = [];
  }

  getStats() {
    const stats = {
      total: this.requests.length,
      failed: 0,
      byStatus: {},
      byType: {}
    };

    this.requests.forEach(req => {
      if (req.failed || (req.response && req.response.status >= 400)) {
        stats.failed++;
      }

      if (req.response && req.response.status) {
        const statusRange = `${Math.floor(req.response.status / 100)}xx`;
        stats.byStatus[statusRange] = (stats.byStatus[statusRange] || 0) + 1;
      }

      if (req.resourceType) {
        stats.byType[req.resourceType] = (stats.byType[req.resourceType] || 0) + 1;
      }
    });

    return stats;
  }
}

export class PerformanceCollector {
  constructor() {
    this.metrics = {};
    this.entries = [];
  }

  addMetrics(metricsData) {
    this.metrics = {
      ...this.metrics,
      ...metricsData,
      timestamp: Date.now()
    };
  }

  addEntry(entry) {
    this.entries.push({
      ...entry,
      id: `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });

    // Keep only recent entries
    if (this.entries.length > 100) {
      this.entries = this.entries.slice(-100);
    }
  }

  getMetrics() {
    return this.metrics;
  }

  getEntries(type = null) {
    if (type) {
      return this.entries.filter(entry => entry.entryType === type);
    }
    return this.entries;
  }

  clearMetrics() {
    this.metrics = {};
    this.entries = [];
  }
}