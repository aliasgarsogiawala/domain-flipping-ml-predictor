import { SignIn } from "@clerk/nextjs";
import BackgroundGlow from "@/components/ui/background-components";
import DashedGridBackground from "@/components/ui/demo";

export default function SignInPage() {
  return (
    <BackgroundGlow className="relative left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] min-h-[calc(100vh-8rem)] w-screen bg-stone-50">
      <DashedGridBackground className="min-h-[calc(100vh-8rem)] w-full">
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
          <div className="w-full max-w-md">
            <SignIn
              appearance={{
                elements: {
                  rootBox: "mx-auto w-full",
                  card:
                    "rounded-3xl border border-stone-200 bg-white p-3 shadow-[0_24px_80px_rgba(0,0,0,0.08)]",
                  headerTitle: "text-stone-950",
                  headerSubtitle: "text-stone-500",
                  socialButtonsBlockButton:
                    "border-stone-200 shadow-none hover:bg-stone-50",
                  formButtonPrimary:
                    "bg-stone-950 hover:bg-stone-800 shadow-none",
                  footerActionLink: "text-stone-950 hover:text-stone-700",
                },
              }}
            />
          </div>
        </div>
      </DashedGridBackground>
    </BackgroundGlow>
  );
}
