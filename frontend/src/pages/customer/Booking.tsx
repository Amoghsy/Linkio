import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, CheckCircle2, Clock, Globe, Zap } from "lucide-react";
import { userService, type Worker } from "@/services/userService";
import { jobService } from "@/services/jobService";
import { paymentService } from "@/services/paymentService";
import { GradientButton } from "@/components/common/GradientButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { t, SUPPORTED_LANGS } from "@/lib/i18n";
import { locationService } from "@/services/locationService";
import { type GeoPoint } from "@/services/mapService";

export default function Booking() {
  const { workerId = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language: uiLanguage } = useAppStore();
  const { user } = useAuthStore();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [emergency, setEmergency] = useState(false);
  const [bookingLanguage, setBookingLanguage] = useState("en");
  const [open, setOpen] = useState(false);
  const [bookedJobId, setBookedJobId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GeoPoint | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "online">("cash");

  useEffect(() => {
    userService.getWorker(workerId).then((nextWorker) => setWorker(nextWorker ?? null));
  }, [workerId]);

  useEffect(() => {
    let active = true;

    const syncLocation = async () => {
      try {
        const location = user?.id
          ? await locationService.syncCustomerLocation(user.id)
          : await locationService.resolveCurrentLocation();

        if (active) {
          setCurrentLocation(location);
        }
      } catch {
        if (active) {
          setCurrentLocation(null);
        }
      }
    };

    void syncLocation();

    return () => {
      active = false;
    };
  }, [user?.id]);

  if (!worker) {
    return null;
  }

  const basePrice = worker.priceFrom;
  const platformFee = Math.round(basePrice * 0.05);
  const emergencySurcharge = emergency ? Math.round(basePrice * 0.2) : 0;
  const total = basePrice + platformFee + emergencySurcharge;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!emergency && (!date || !time)) {
      toast({ title: "Pick a date and time", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const job = await jobService.createBooking({
        workerId,
        ...(currentLocation
          ? { customerLat: currentLocation.lat, customerLng: currentLocation.lng }
          : {}),
        date: emergency ? new Date().toISOString().split("T")[0] : date,
        time: emergency
          ? new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
          : time,
        notes,
        price: total,
        title: `Booking with ${worker.name}`,
        category: worker.category,
        priority: emergency ? "high" : "normal",
        language: bookingLanguage,
      });

      if (paymentMethod === "online") {
        try {
          const config = await paymentService.getConfig();
          const payment = await paymentService.createPayment(job.id, total);

          const options = {
            key: config.key,
            amount: total * 100,
            currency: "INR",
            name: "Linkio",
            description: `Payment for booking with ${worker.name}`,
            order_id: payment.razorpayOrderId,
            handler: async function (response: any) {
              try {
                await paymentService.verifyPayment({
                  paymentId: payment.paymentId,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                });
                setBookedJobId(job.id);
                setOpen(true);
              } catch (verifyError: any) {
                toast({
                  title: "Payment verification failed",
                  description: verifyError?.message || "Please contact support.",
                  variant: "destructive",
                });
              }
            },
            prefill: {
              name: user?.name,
              contact: user?.phone,
            },
            theme: {
              color: "#3399cc",
            },
            modal: {
              ondismiss: function() {
                toast({
                  title: "Payment cancelled",
                  description: "You can pay later from your dashboard.",
                });
                setBookedJobId(job.id);
                setOpen(true);
              }
            }
          };
          
          if (!(window as any).Razorpay) {
            throw new Error("Razorpay SDK not loaded");
          }
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } catch (paymentError: any) {
          toast({
            title: "Payment initialization failed",
            description: paymentError?.message || "Could not start online payment. You can pay later.",
            variant: "destructive",
          });
          setBookedJobId(job.id);
          setOpen(true);
        }
      } else {
        setBookedJobId(job.id);
        setOpen(true);
      }
    } catch (error: any) {
      toast({
        title: "Booking failed",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">Book {worker.name}</h1>
      <p className="text-sm text-muted-foreground">
        {worker.category} · {worker.rating.toFixed(1)} stars
      </p>

      <div className="mt-6 grid md:grid-cols-[1fr_300px] gap-6">
        <form
          onSubmit={submit}
          className="rounded-2xl border border-border bg-card p-6 space-y-4"
        >
          <div className="flex items-center justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/20">
            <div className="flex items-center gap-2">
              <Zap
                size={16}
                className={emergency ? "text-destructive fill-current" : "text-muted-foreground"}
              />
              <div>
                <p className="text-sm font-semibold">{t("booking.emergency", uiLanguage)}</p>
                <p className="text-xs text-muted-foreground">
                  Skip scheduling · Immediate dispatch (+20%)
                </p>
              </div>
            </div>
            <Switch
              id="emergency-booking"
              checked={emergency}
              onCheckedChange={setEmergency}
            />
          </div>

          {!emergency && (
            <>
              <div>
                <Label className="flex items-center gap-2">
                  <Calendar size={14} />
                  Date
                </Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Clock size={14} />
                  Time
                </Label>
                <Input
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="mt-1.5"
                />
              </div>
            </>
          )}

          <div>
            <Label>Describe the job (optional)</Label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="e.g. Kitchen sink leak under the counter"
              className="mt-1.5 min-h-[100px]"
              maxLength={500}
            />
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Globe size={14} />
              {t("booking.language", uiLanguage)}
            </Label>
            <select
              value={bookingLanguage}
              onChange={(event) => setBookingLanguage(event.target.value)}
              className="mt-1.5 w-full h-10 rounded-xl border border-border bg-secondary px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {SUPPORTED_LANGS.map((language) => (
                <option key={language.value} value={language.value}>
                  {language.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-border">
            <Label className="mb-2 block">Payment Method</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div 
                className={`border rounded-xl p-3 cursor-pointer transition-colors ${paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-border'}`}
                onClick={() => setPaymentMethod("cash")}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Cash on Service</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'cash' ? 'border-primary' : 'border-muted-foreground'}`}>
                    {paymentMethod === 'cash' && <div className="w-2 h-2 bg-primary rounded-full" />}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Pay the worker directly after completion</p>
              </div>

              <div 
                className={`border rounded-xl p-3 cursor-pointer transition-colors ${paymentMethod === 'online' ? 'border-primary bg-primary/5' : 'border-border'}`}
                onClick={() => setPaymentMethod("online")}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Pay Online</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'online' ? 'border-primary' : 'border-muted-foreground'}`}>
                    {paymentMethod === 'online' && <div className="w-2 h-2 bg-primary rounded-full" />}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Pay now securely via Razorpay</p>
              </div>
            </div>
          </div>

          <GradientButton type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Confirming..." : `${t("booking.confirm", uiLanguage)} · ₹${total}`}
          </GradientButton>
        </form>

        <aside className="rounded-2xl border border-border bg-card p-6 h-fit">
          <h3 className="font-semibold">Price summary</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service</span>
              <span>₹{basePrice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform fee</span>
              <span>₹{platformFee}</span>
            </div>
            {emergency && (
              <div className="flex justify-between text-destructive">
                <span>Emergency surcharge</span>
                <span>₹{emergencySurcharge}</span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>₹{total}</span>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Pay after the job is completed.
          </p>
        </aside>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto h-14 w-14 rounded-full bg-gradient-brand grid place-items-center text-primary-foreground">
              <CheckCircle2 size={28} />
            </div>
            <DialogTitle className="text-center">
              {emergency ? "Emergency booking confirmed!" : "Booking confirmed!"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-center text-sm text-muted-foreground">
            {emergency
              ? `${worker.name} is being dispatched to your location now.`
              : `${worker.name} has been notified. You can track the job status now.`}
          </p>
          <GradientButton
            className="w-full"
            onClick={() => bookedJobId && navigate(`/app/jobs/${bookedJobId}`)}
          >
            Track job
          </GradientButton>
        </DialogContent>
      </Dialog>
    </div>
  );
}
