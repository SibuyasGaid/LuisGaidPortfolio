// The only module that imports GSAP. It is reached exclusively through lazily
// loaded components, so none of this is part of the initial JavaScript bundle.
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export { gsap, ScrollTrigger, useGSAP };
