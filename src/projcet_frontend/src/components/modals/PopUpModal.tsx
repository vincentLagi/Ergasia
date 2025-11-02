import { useModal } from "../../contexts/modal-context";
import { ModalBody, ModalContent, ModalFooter } from "../ui/animated-modal";

export function PopUpModal({ res, loading }: { res: string[]; loading: boolean }) {
    const { open, setOpen } = useModal();

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
            <ModalBody className="flex flex-column items-center space-x-4">
                <ModalContent className="max-w-2xl mx-auto bg-[#F9F7F7] w-[40vw] h-[40vh] flex flex-col justify-between">
                    <div className="space-y-8 px-8 pt-8 pb-6">
                        <div className="text-center">
                            {loading ? ( 
                                <div className="flex flex-col items-center justify-center">
                                    <div className="animate-spin rounded-full h-15 w-15 border-b-2 mt-10 border-[#112D4E]"></div>
                                    <p className="mt-4 text-[#112D4E] text-2xl">Posting Job...</p>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-3xl font-bold text-[#112D4E] border-b-2 border-[#112D4E] pb-6">
                                        {res[0]}
                                    </h3>
                                    <p className="mt-20 text-[#112D4E] text-3xl">{res[1]}</p>
                                </>
                            )}
                        </div>
                    </div>

                    {!loading && ( 
                        <ModalFooter className="flex items-center justify-center mt-2 p-0">
                            <div
                                onClick={() => setOpen(false)}
                                className="w-full h-full text-lg text-center font-semibold rounded-b-2xl border-b border-b-[#112D4E] text-black transition-colors hover:text-white hover:bg-[#D9534F] hover:border-[#D9534F] py-4 cursor-pointer"
                            >
                                Close
                            </div>
                        </ModalFooter>
                    )}
                </ModalContent>
            </ModalBody>
        </div>
    );
}