// Analytics and tracking utilities
interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
}

class Analytics {
  private isEnabled: boolean = process.env.NODE_ENV === 'production';
  private userId: string | null = null;

  setUserId(userId: string) {
    this.userId = userId;
  }

  track(event: string, properties?: Record<string, any>) {
    if (!this.isEnabled) {
      console.log('Analytics Event:', { event, properties, userId: this.userId });
      return;
    }

    // In production, integrate with analytics service like Mixpanel, Amplitude, etc.
    this.sendEvent({
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
      userId: this.userId || undefined,
    });
  }

  private sendEvent(eventData: AnalyticsEvent) {
    // Implementation would depend on your analytics provider
    // Example for a generic analytics API:
    /*
    fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    }).catch(error => {
      console.error('Analytics error:', error);
    });
    */
  }

  // Predefined event tracking methods
  trackPageView(page: string) {
    this.track('page_view', { page });
  }

  trackUserSignup(method: string, role: string) {
    this.track('user_signup', { method, role });
  }

  trackUserLogin(method: string) {
    this.track('user_login', { method });
  }

  trackClusterCreated(clusterId: string, pincode: string) {
    this.track('cluster_created', { clusterId, pincode });
  }

  trackClusterJoined(clusterId: string, clusterName: string) {
    this.track('cluster_joined', { clusterId, clusterName });
  }

  trackOrderCreated(orderId: string, supplierId: string, totalAmount: number) {
    this.track('order_created', { orderId, supplierId, totalAmount });
  }

  trackOrderJoined(orderId: string, totalAmount: number, itemCount: number) {
    this.track('order_joined', { orderId, totalAmount, itemCount });
  }

  trackProductAdded(productId: string, categoryId: string, price: number) {
    this.track('product_added', { productId, categoryId, price });
  }

  trackSearchPerformed(query: string, resultCount: number) {
    this.track('search_performed', { query, resultCount });
  }

  trackLanguageChanged(from: string, to: string) {
    this.track('language_changed', { from, to });
  }

  trackError(error: string, context?: string) {
    this.track('error_occurred', { error, context });
  }

  trackFeatureUsed(feature: string, context?: Record<string, any>) {
    this.track('feature_used', { feature, ...context });
  }

  // Performance tracking
  trackPerformance(metric: string, value: number, context?: Record<string, any>) {
    this.track('performance_metric', { metric, value, ...context });
  }

  // Business metrics
  trackSavingsCalculated(originalAmount: number, discountedAmount: number, savingsPercentage: number) {
    this.track('savings_calculated', {
      originalAmount,
      discountedAmount,
      savingsAmount: originalAmount - discountedAmount,
      savingsPercentage,
    });
  }

  trackBulkDiscountApplied(productId: string, quantity: number, discountPercentage: number) {
    this.track('bulk_discount_applied', {
      productId,
      quantity,
      discountPercentage,
    });
  }
}

export const analytics = new Analytics();

// Performance monitoring
export const measurePerformance = (name: string, fn: () => Promise<any>) => {
  return async (...args: any[]) => {
    const startTime = performance.now();
    try {
      const result = await fn.apply(null, args);
      const endTime = performance.now();
      analytics.trackPerformance(name, endTime - startTime);
      return result;
    } catch (error) {
      const endTime = performance.now();
      analytics.trackPerformance(`${name}_error`, endTime - startTime);
      analytics.trackError(error instanceof Error ? error.message : String(error), name);
      throw error;
    }
  };
};

// Error boundary integration
export const trackErrorBoundary = (error: Error, errorInfo: any) => {
  analytics.trackError(error.message, JSON.stringify(errorInfo));
};