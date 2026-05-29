import { SignUp } from "@clerk/nextjs";
import BackgroundGlow from "@/components/ui/background-components";
import DashedGridBackground from "@/components/ui/demo";

export default function SignUpPage() {
  return (
    <BackgroundGlow className="relative left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] min-h-[calc(100vh-8rem)] w-screen bg-stone-50">
      <DashedGridBackground className="min-h-[calc(100vh-8rem)] w-full">
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
          <div className="w-full max-w-md">
            <SignUp />
          </div>
        </div>
      </DashedGridBackground>
    </BackgroundGlow>
  );
}
