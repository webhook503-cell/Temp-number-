import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Phone, Copy, RefreshCw, Trash2, User, Clock, Shield, Server, RotateCcw, Inbox } from "lucide-react";
import type { Message } from "@shared/schema";

interface PhoneNumberResponse {
  phoneNumber: string;
}

function formatPhoneNumber(phoneNumber: string): string {
  // Format +19545551234 to +1 (954) 555-1234
  const cleaned = phoneNumber.replace(/[^\d]/g, "");
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phoneNumber;
}

function formatTimestamp(date: Date | string): string {
  const messageDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - messageDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "Yesterday";
  
  return messageDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function Home() {
  const { toast } = useToast();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  // Fetch phone number
  const { data: phoneData, error: phoneError } = useQuery<PhoneNumberResponse>({
    queryKey: ["/api/phone-number"],
  });

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  // Clear messages mutation
  const clearMessagesMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/messages"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({
        title: "Messages cleared",
        description: "All messages have been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear messages.",
        variant: "destructive",
      });
    },
  });

  // Auto-refresh functionality
  useEffect(() => {
    const interval = setInterval(async () => {
      setIsAutoRefreshing(true);
      await refetchMessages();
      setLastUpdated(new Date());
      setIsAutoRefreshing(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [refetchMessages]);

  const handleCopyPhoneNumber = async () => {
    if (phoneData?.phoneNumber) {
      try {
        await navigator.clipboard.writeText(phoneData.phoneNumber);
        toast({
          title: "Copied!",
          description: "Phone number copied to clipboard.",
        });
      } catch (error) {
        toast({
          title: "Copy failed",
          description: "Could not copy to clipboard.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCopyMessage = async (messageContent: string) => {
    try {
      await navigator.clipboard.writeText(messageContent);
      toast({
        title: "Copied!",
        description: "Message copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = async () => {
    setIsAutoRefreshing(true);
    await refetchMessages();
    setLastUpdated(new Date());
    setIsAutoRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Messages updated successfully.",
    });
  };

  const handleClearMessages = () => {
    if (messages.length === 0) {
      toast({
        title: "No messages",
        description: "There are no messages to clear.",
      });
      return;
    }

    if (confirm("Are you sure you want to clear all messages? This action cannot be undone.")) {
      clearMessagesMutation.mutate();
    }
  };

  return (
    <div className="bg-background min-h-screen" data-testid="home-page">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm" data-testid="header">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary text-primary-foreground p-3 rounded-lg">
                <Phone className="h-6 w-6" data-testid="phone-icon" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground" data-testid="app-title">
                  Temporary SMS Receiver
                </h1>
                <p className="text-muted-foreground text-sm" data-testid="app-subtitle">
                  Real-time message reception
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 bg-secondary px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full pulse-dot" data-testid="status-indicator"></div>
              <span className="text-secondary-foreground text-sm font-medium" data-testid="status-text">Live</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6" data-testid="main-content">
        {/* Phone Number Display */}
        <Card className="mb-6 shadow-sm" data-testid="phone-display-card">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-2" data-testid="phone-label">
                Your Temporary Phone Number
              </p>
              {phoneError ? (
                <div className="text-destructive mb-4" data-testid="phone-error">
                  <p>Error loading phone number</p>
                  <p className="text-sm">Please configure TWILIO_PHONE_NUMBER environment variable</p>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <span 
                    className="text-3xl font-mono font-bold text-primary" 
                    data-testid="phone-number"
                  >
                    {phoneData?.phoneNumber ? formatPhoneNumber(phoneData.phoneNumber) : "Loading..."}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyPhoneNumber}
                    disabled={!phoneData?.phoneNumber}
                    data-testid="button-copy-phone"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span data-testid="active-duration">Active for 24 hours</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="h-4 w-4" />
                  <span data-testid="sms-only">SMS Only</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message Controls */}
        <div className="flex items-center justify-between mb-4" data-testid="message-controls">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-foreground" data-testid="messages-title">
              Received Messages
            </h2>
            <Badge variant="secondary" data-testid="message-count">
              {messages.length}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={isAutoRefreshing}
              data-testid="button-refresh"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isAutoRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearMessages}
              disabled={clearMessagesMutation.isPending || messages.length === 0}
              data-testid="button-clear"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>

        {/* Messages List */}
        {messagesLoading ? (
          <div className="space-y-3" data-testid="loading-state">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="animate-pulse">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="bg-muted rounded-lg w-10 h-10"></div>
                    <div className="flex-1">
                      <div className="bg-muted h-4 w-32 mb-2 rounded"></div>
                      <div className="bg-muted h-3 w-24 rounded"></div>
                    </div>
                  </div>
                  <div className="bg-muted h-4 w-full rounded"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <Card className="p-12 text-center" data-testid="empty-state">
            <div className="max-w-sm mx-auto">
              <div className="bg-muted p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="empty-title">
                No messages yet
              </h3>
              <p className="text-muted-foreground mb-4" data-testid="empty-description">
                Messages sent to your temporary number will appear here automatically.
              </p>
              <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full pulse-dot"></div>
                <span data-testid="waiting-text">Waiting for messages...</span>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-3" data-testid="messages-list">
            {messages.map((message, index) => (
              <Card key={message.id} className="p-4 shadow-sm message-enter" data-testid={`message-${index}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground" data-testid={`message-from-${index}`}>
                        {formatPhoneNumber(message.from)}
                      </p>
                      <p className="text-xs text-muted-foreground" data-testid={`message-time-${index}`}>
                        {formatTimestamp(message.receivedAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyMessage(message.body)}
                    data-testid={`button-copy-message-${index}`}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="pl-11">
                  <p className="text-foreground leading-relaxed" data-testid={`message-body-${index}`}>
                    {message.body}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Auto-refresh indicator */}
        {isAutoRefreshing && (
          <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg p-3 shadow-lg" data-testid="refresh-indicator">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full pulse-dot"></div>
              <span className="text-sm text-foreground">Checking for new messages...</span>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-12" data-testid="footer">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Server className="h-4 w-4" />
                <span>Webhook Status:</span>
                <span className="text-green-600 font-medium" data-testid="webhook-status">Connected</span>
              </div>
              <div className="flex items-center space-x-1">
                <RotateCcw className="h-4 w-4" />
                <span>Last Updated:</span>
                <span data-testid="last-updated">{formatTimestamp(lastUpdated)}</span>
              </div>
            </div>
            <div className="text-xs" data-testid="auto-refresh-info">
              <span>Auto-refresh every 5 seconds</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
