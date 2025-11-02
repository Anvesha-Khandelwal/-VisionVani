import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Database, MessageSquare, Users, Shield } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold">Multi-Tenant Chatbot Platform</h1>
          </div>
          <Button onClick={() => navigate("/auth")}>Get Started</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4">Build Your Domain-Specific AI Chatbot</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create a secure, isolated chatbot with your own knowledge base. Each tenant gets their own AI assistant trained on their specific data.
          </p>
          <Button size="lg" className="mt-8" onClick={() => navigate("/auth")}>
            Create Your Chatbot
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="animate-slide-up">
            <CardContent className="pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Multi-Tenant</h3>
              <p className="text-sm text-muted-foreground">
                Each user gets their own isolated environment with complete data separation
              </p>
            </CardContent>
          </Card>

          <Card className="animate-slide-up [animation-delay:0.1s]">
            <CardContent className="pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 mb-4">
                <Database className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Custom Knowledge Base</h3>
              <p className="text-sm text-muted-foreground">
                Upload your domain-specific data and train your chatbot on it
              </p>
            </CardContent>
          </Card>

          <Card className="animate-slide-up [animation-delay:0.2s]">
            <CardContent className="pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Smart AI Responses</h3>
              <p className="text-sm text-muted-foreground">
                Powered by advanced AI that understands context from your knowledge base
              </p>
            </CardContent>
          </Card>

          <Card className="animate-slide-up [animation-delay:0.3s]">
            <CardContent className="pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 mb-4">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Secure & Private</h3>
              <p className="text-sm text-muted-foreground">
                Row-level security ensures your data is completely isolated and protected
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 border-primary/20 animate-fade-in">
          <CardContent className="pt-8 pb-8">
            <h3 className="text-2xl font-bold text-center mb-4">How It Works</h3>
            <div className="grid md:grid-cols-3 gap-8 mt-8">
              <div className="text-center">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold mb-3">
                  1
                </div>
                <h4 className="font-semibold mb-2">Create Account</h4>
                <p className="text-sm text-muted-foreground">
                  Sign up and get your unique tenant ID
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold mb-3">
                  2
                </div>
                <h4 className="font-semibold mb-2">Build Knowledge Base</h4>
                <p className="text-sm text-muted-foreground">
                  Add your domain-specific information and data
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold mb-3">
                  3
                </div>
                <h4 className="font-semibold mb-2">Chat with AI</h4>
                <p className="text-sm text-muted-foreground">
                  Your chatbot answers using your knowledge base
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Index;