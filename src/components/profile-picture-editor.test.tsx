import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfilePictureEditor } from "./profile-picture-editor";
const mocks = vi.hoisted(() => ({ refresh: vi.fn(), user: { hasImage: false, imageUrl: "https://images.clerk.example/saved.png", setProfileImage: vi.fn(), updateMetadata: vi.fn(), reload: vi.fn() } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("@clerk/nextjs", () => ({ useUser: () => ({ user: mocks.user }) }));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.hasImage = false;
  mocks.user.setProfileImage.mockResolvedValue({}); mocks.user.updateMetadata.mockResolvedValue({}); mocks.user.reload.mockResolvedValue({});
  URL.createObjectURL = vi.fn(() => "blob:test-photo"); URL.revokeObjectURL = vi.fn();
});
describe("profile photo persistence", () => {
  it("opens the save dialog when a photo is selected directly, persists it and uses the durable provider URL", async () => {
    render(<ProfilePictureEditor initials="AB" />);
    const file = new File(["image-bytes"], "photo.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Upload profile photo"), { target: { files: [file] } });
    expect(screen.getByRole("dialog", { name: "Change profile photo" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save avatar" }));
    await waitFor(() => expect(mocks.user.setProfileImage).toHaveBeenCalledWith({ file }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("img", { name: "Profile preview" })).toHaveAttribute("src", mocks.user.imageUrl);
    expect(mocks.user.updateMetadata).toHaveBeenCalledWith({ unsafeMetadata: { latticeAvatarPreset: null } });
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("shows rejected file and provider errors while retaining a retryable dialog", async () => {
    render(<ProfilePictureEditor initials="AB" />);
    fireEvent.change(screen.getByLabelText("Upload profile photo"), { target: { files: [new File(["not an image"], "doc.pdf", { type: "application/pdf" })] } });
    expect(screen.getByText("Choose a PNG, JPG, or WebP image.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Upload profile photo"), { target: { files: [new File(["bytes"], "photo.png", { type: "image/png" })] } });
    mocks.user.setProfileImage.mockRejectedValueOnce(new Error("Provider unavailable"));
    fireEvent.click(screen.getByRole("button", { name: "Save avatar" }));
    expect(await screen.findByText(/couldn't save your profile photo/)).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("persists emoji selection and never deletes an unchanged uploaded image", async () => {
    mocks.user.hasImage = true;
    render(<ProfilePictureEditor initialImageUrl={mocks.user.imageUrl} />);
    fireEvent.click(screen.getByRole("button", { name: "Change profile photo" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Use an Emoji" }));
    fireEvent.click(screen.getByRole("button", { name: "Save avatar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(mocks.user.setProfileImage).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Change profile photo" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Use an Emoji" }));
    fireEvent.click(screen.getByRole("button", { name: /^Presets$/ }));
    fireEvent.click(screen.getByRole("button", { name: "Use Rocket preset" }));
    fireEvent.click(screen.getByRole("button", { name: "Save avatar" }));
    await waitFor(() => expect(mocks.user.updateMetadata).toHaveBeenCalledWith({ unsafeMetadata: { latticeAvatarPreset: { colorId: "slate", presetId: "rocket" } } }));
    expect(mocks.user.setProfileImage).toHaveBeenCalledWith({ file: null });
  });
});
