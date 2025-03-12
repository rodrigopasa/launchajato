import { useEffect, useState } from "react";
import { useStripe } from "@stripe/react-stripe-js";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";

export default function PaymentSuccess() {
  const stripe = useStripe();
  const [message, setMessage] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Recupera o status do pagamento usando o payment_intent_client_secret da URL
    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (clientSecret) {
      stripe
        .retrievePaymentIntent(clientSecret)
        .then(({ paymentIntent }) => {
          switch (paymentIntent?.status) {
            case "succeeded":
              setMessage("Pagamento realizado com sucesso!");
              break;
            case "processing":
              setMessage("Seu pagamento está sendo processado.");
              break;
            case "requires_payment_method":
              setMessage("Seu pagamento não foi bem sucedido, tente novamente.");
              break;
            default:
              setMessage("Algo deu errado.");
              break;
          }
        })
        .catch((err) => {
          toast({
            title: "Erro",
            description: "Não foi possível verificar o status do pagamento.",
            variant: "destructive",
          });
        });
    }
  }, [stripe, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-center">Status do Pagamento</CardTitle>
          <CardDescription className="text-center">{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Obrigado por escolher nossos serviços. Você receberá um e-mail de confirmação em breve.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => setLocation("/dashboard")}>
            Voltar para o Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}